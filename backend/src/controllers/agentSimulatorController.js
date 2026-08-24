// src/controllers/agentSimulatorController.js
import { v4 as uuvidv4 } from 'uuid';
import { Product } from '../models/Product.js';
import { GoogleGenerativeAI, FunctionCallingMode, SchemaType } from '@google/generative-ai';

const AGENT_KEY_DEFAULT = process.env.AGENT_DEMO_KEY || 'agentkey_demo_alpha';

export const runAgentSimulation = async (req, res) => {
  const { prompt, scenarioId, agentKey = AGENT_KEY_DEFAULT } = req.body;
  const steps = [];
  const ledger = [];

  const addStep = (type, title, details = {}) => {
    const step = {
      id: uuvidv4(),
      timestamp: new Date().toISOString(),
      type,
      title,
      details,
    };
    steps.push(step);
    return step;
  };

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const canUseGemini = apiKey && apiKey !== 'your_gemini_api_key_here' && !scenarioId;

    if (canUseGemini) {
      addStep('THOUGHT', 'Agent initialized with Google Gemini LLM', {
        model: process.env.GEMINI_MODEL || 'gemini-3.6-flash',
        agentKey,
        mission: prompt || 'Autonomous Procurement Mission',
      });

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: process.env.GEMINI_MODEL || 'gemini-3.6-flash',
        systemInstruction: 'You are an autonomous AI buyer agent connecting to SafeAgent Gateway on Razorpay. Always call browse_catalog first to check authoritative prices and stock. Formulate purchases using request_purchase with a clear reason (>10 chars). If an upsellOffer is returned, evaluate it and call request_purchase with upsellRef if suitable.',
        tools: [
          {
            functionDeclarations: [
              {
                name: 'browse_catalog',
                description: 'Retrieve real-time product catalog with prices and stock levels.',
                parameters: { type: SchemaType.OBJECT, properties: {} },
              },
              {
                name: 'request_purchase',
                description: 'Submit purchase request to SafeAgent Gateway.',
                parameters: {
                  type: SchemaType.OBJECT,
                  properties: {
                    sku: { type: SchemaType.STRING, description: 'Product SKU' },
                    qty: { type: SchemaType.INTEGER, description: 'Quantity (>= 1)' },
                    maxBudget: { type: SchemaType.NUMBER, description: 'Advisory budget in INR' },
                    reason: { type: SchemaType.STRING, description: 'Natural language justification' },
                    upsellRef: { type: SchemaType.STRING, description: 'Optional offerId from prior upsell offer' },
                  },
                  required: ['sku', 'qty', 'maxBudget', 'reason'],
                },
              },
            ],
          },
        ],
        toolConfig: { functionCallingConfig: { mode: FunctionCallingMode.AUTO } },
      });

      const contents = [{ role: 'user', parts: [{ text: prompt || 'Browse catalog and buy equipment within budget.' }] }];
      const port = process.env.PORT || 5000;
      const baseUrl = 'http://localhost:' + port;

      let loopCount = 0;
      const MAX_LOOPS = 6;
      while (loopCount < MAX_LOOPS) {
        loopCount++;
        const result = await model.generateContent({ contents });
        const response = result.response;
        const candidate = response.candidates?.[0];
        if (!candidate || !candidate.content) break;

        contents.push(candidate.content);
        const functionCalls = response.functionCalls?.() ?? [];

        if (functionCalls.length > 0) {
          const responseParts = [];
          for (const call of functionCalls) {
            let toolResult;

            if (call.name === 'browse_catalog') {
              addStep('TOOL_CALL', 'Agent called browse_catalog()', { function: 'browse_catalog' });
              const products = await Product.find({}).lean();
              toolResult = { products };
              addStep('THOUGHT', 'Received ' + products.length + ' catalog items from Merchant Gateway', {
                items: products.map((p) => p.title + ' (Rs ' + p.price + ', Stock: ' + p.stock + ')'),
              });
            } else if (call.name === 'request_purchase') {
              const args = call.args || {};
              addStep('TOOL_CALL', 'Agent called request_purchase(' + args.sku + ', qty: ' + (args.qty || 1) + ')', {
                sku: args.sku,
                qty: args.qty,
                maxBudget: args.maxBudget,
                reason: args.reason,
                upsellRef: args.upsellRef,
              });

              const idempotencyKey = uuvidv4();
              const fetchRes = await fetch(baseUrl + '/api/checkout/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-agent-key': agentKey },
                body: JSON.stringify({
                  sku: args.sku,
                  qty: Number(args.qty) || 1,
                  maxBudget: Number(args.maxBudget) || 5000,
                  reason: args.reason || 'Procurement order via Gemini Studio',
                  idempotencyKey,
                  upsellRef: args.upsellRef,
                }),
              });

              toolResult = await fetchRes.json();

              addStep('FIREWALL_DECISION', 'SafeAgent Decision: ' + (toolResult.status || 'PROCESSED'), {
                status: toolResult.status,
                amount: toolResult.amount,
                blockReason: toolResult.blockReason,
                explanation: toolResult.explanation,
                razorpayOrderId: toolResult.razorpayOrderId,
                auditId: toolResult.auditId,
              });

              if (toolResult.upsellOffer) {
                addStep('UPSELL', 'AIUpsell Generated: ' + toolResult.upsellOffer.title + ' (+Rs ' + toolResult.upsellOffer.price + ')', {
                  offerId: toolResult.upsellOffer.offerId,
                  sku: toolResult.upsellOffer.sku,
                  price: toolResult.upsellOffer.price,
                  pitch: toolResult.upsellOffer.pitch,
                });
              }

              ledger.push({
                sku: args.sku,
                qty: args.qty || 1,
                amount: toolResult.amount,
                status: toolResult.status,
                blockReason: toolResult.blockReason,
                razorpayOrderId: toolResult.razorpayOrderId,
                auditId: toolResult.auditId,
                upsellRef: args.upsellRef,
              });
            }

            responseParts.push({
              functionResponse: {
                name: call.name,
                response: { result: toolResult },
              },
            });
          }

          contents.push({ role: 'user', parts: responseParts });
          continue;
        }

        const finalText = response.text?.();
        if (finalText) {
          addStep('FINAL_REPORT', 'Mission Completed by I Buyer', { report: finalText });
        }
        break;
      }

      return res.json({ success: true, mode: 'live_gemini', steps, ledger });
    }

    return executePresetScenario(prompt, scenarioId, agentKey, addStep, ledger, res);
  } catch (err) {
    console.error('[AGENT-SIMULATOR] Error:', err);
    addStep('ERROR', 'Simulation failed with exception', { error: err.message });
    return res.status(500).json({ success: false, error: err.message, steps, ledger });
  }
};

async function executePresetScenario(prompt, scenarioId, agentKey, addStep, ledger, res) {
  const port = process.env.PORT || 5000;
  const baseUrl = 'http://localhost:' + port;

  addStep('THOUGHT', 'Agent initialized in High-Precision Scenario Mode', {
    scenario: scenarioId || 'custom_simulation',
    prompt: prompt || 'Run procurement scenario',
  });

  addStep('TOOL_CALL', 'Agent called browse_catalog()', {});
  const products = await Product.find({}).lean();
  addStep('THOUGHT', 'Fetched ' + products.length + ' live products from Merchant DB', {
    catalogPreview: products.slice(0, 4).map((p) => p.title + ' (Rs ' + p.price + ')'),
  });

  if (scenarioId === 'auto_micro' || (prompt && prompt.toLowerCase().includes('cable'))) {
    addStep('THOUGHT', 'Formulated purchase for sub-Rs 500 accessory (Braided 65W USB-C Cable)', {
      sku: 'prod_usb_c_cable',
      budget: 1000,
    });

    const resp = await fetch(baseUrl + '/api/checkout/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-agent-key': agentKey },
      body: JSON.stringify({
        sku: 'prod_usb_c_cable',
        qty: 1,
        maxBudget: 1000,
        reason: 'Replacing frayed charging cable at workstation #4',
        idempotencyKey: uuvidv4(),
      }),
    });
    const result = await resp.json();

    addStep('FIREWALL_DECISION', 'SafeAgent Firewall: AUTO_APPROVED (Rs ' + result.amount + ')', result);
    ledger.push({
      sku: 'prod_usb_c_cable',
      qty: 1,
      amount: result.amount,
      status: result.status,
      razorpayOrderId: result.razorpayOrderId,
      auditId: result.auditId,
    });
    addStep('FINAL_REPORT', 'Order instantly processed on Razorpay. Zero human friction required.', {
      razorpayOrderId: result.razorpayOrderId,
    });
  } else if (scenarioId === 'gate_1click_upsell' || (prompt && prompt.toLowerCase().includes('keyboard'))) {
    addStep('THOUGHT', 'Targeting Mechanical Keyboard (Rs 2,800) within Rs 5,000 budget', {});
    const resp = await fetch(baseUrl + '/api/checkout/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-agent-key': agentKey },
      body: JSON.stringify({
        sku: 'prod_mech_keyboard',
        qty: 1,
        maxBudget: 5000,
        reason: 'Developer onboarding ergonomic setup',
        idempotencyKey: uuvidv4(),
      }),
    });
    const result = await resp.json();

    addStep('FIREWALL_DECISION', 'SafeAgent Firewall: GATED_1CLICK (Rs ' + result.amount + ')', result);
    if (result.upsellOffer) {
      addStep('UPSELL', 'AIUpsell Engine: ' + result.upsellOffer.title + ' (+Rs ' + result.upsellOffer.price + ')', result.upsellOffer);

      addStep('THOUGHT', 'Evaluating upsell offer against remaining Rs 2,200 headroom: Accepting companion item!', {});
      const upsellResp = await fetch(baseUrl + '/api/checkout/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-agent-key': agentKey },
        body: JSON.stringify({
          sku: result.upsellOffer.sku,
          qty: 1,
          maxBudget: 2200,
          reason: 'Accepting companion bundle for keyboard',
          idempotencyKey: uuvidv4(),
          upsellRef: result.upsellOffer.offerId,
        }),
      });
      const upsellResult = await upsellResp.json();
      addStep('FIREWALL_DECISION', 'Upsell Order Status: ' + upsellResult.status + ' (Rs ' + upsellResult.amount + ')', upsellResult);
      ledger.push({
        sku: result.upsellOffer.sku,
        qty: 1,
        amount: upsellResult.amount,
        status: upsellResult.status,
        upsellRef: result.upsellOffer.offerId,
        auditId: upsellResult.auditId,
      });
    }

    ledger.push({
      sku: 'prod_mech_keyboard',
      qty: 1,
      amount: result.amount,
      status: result.status,
      auditId: result.auditId,
    });
    addStep('FINAL_REPORT', 'Primary keyboard order queued for 1-Click Approval + Upsell offer accepted by AI.', {});
  } else if (scenarioId === 'gate_2fa' || (prompt && prompt.toLowerCase().includes('monitor'))) {
    addStep('THOUGHT', 'High-value equipment request: 27-inch 4K Monitor (Rs 24,000)', {});
    const resp = await fetch(baseUrl + '/api/checkout/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-agent-key': agentKey },
      body: JSON.stringify({
        sku: 'prod_4k_monitor',
        qty: 1,
        maxBudget: 30000,
        reason: 'Design lead color-calibrated 4K display',
        idempotencyKey: uuvidv4(),
      }),
    });
    const result = await resp.json();
    addStep('FIREWALL_DECISION', 'SafeAgent Firewall: GATED_2FA (Rs ' + result.amount + ')', result);
    ledger.push({
      sku: 'prod_4k_monitor',
      qty: 1,
      amount: result.samount,
      status: result.status,
      auditId: result.auditId,
    });
    addStep('FINAL_REPORT', 'Order exceeds Rs 5,000 threshold. Locked in Approval Queue awaiting TOTP 2FA code.', {
      auditId: result.auditId,
    });
  } else if (scenarioId === 'guest_link' || (prompt && prompt.toLowerCase().includes('guest'))) {
    addStep('THOUGHT', 'Universal Guest AI (No pre-configured corporate key) requesting purchase', {});
    const resp = await fetch(baseUrl + '/api/checkout/guest-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sku: 'prod_mech_keyboard',
        qty: 1,
        reason: 'Guest AI shopping via open protocol',
      }),
    });
    const result = await resp.json();
    addStep('FIREWALL_DECISION', 'Universal Protocol: Razorpay Link Generated (Rs ' + result.amount + ')', result);
    ledger.push({
      sku: 'prod_mech_keyboard',
      qty: 1,
      amount: result.amount,
      status: result.status,
      razorpayOrderId: result.paymentLinkId,
      paymentUrl: result.paymentUrl,
    });
    addStep('FINAL_REPORT', 'Guest payment URL issued: ' + result.paymentUrl + '. Handing link to user to pay via UPI.', {
      paymentUrl: result.paymentUrl,
    });
  } else {
    addStep('THOUGHT', 'Executing autonomous procurement for: ' + (prompt || 'General Equipment'), {});
    const resp = await fetch(baseUrl + '/api/checkout/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-agent-key': agentKey },
      body: JSON.stringify({
        sku: 'prod_usb_c_cable',
        qty: 1,
        maxBudget: 2000,
        reason: prompt || 'Procurement purchase',
        idempotencyKey: uuvidv4(),
      }),
    });
    const result = await resp.json();
    addStep('FIREWALL_DECISION', 'SafeAgent Decision: ' + result.status, result);
    ledger.push({
      sku: 'prod_usb_c_cable',
      qty: 1,
      amount: result.amount,
      status: result.status,
      razorpayOrderId: result.razorpayOrderId,
      auditId: result.auditId,
    });
    addStep('FINAL_REPORT', 'Completed procurement sequence.', {});
  }

  return res.json({ success: true, mode: 'scenario_engine', steps, ledger });
}
