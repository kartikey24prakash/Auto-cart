import { useState, useEffect, useCallback } from 'react';
import { auditApi } from '../services/auditApi';

export function useAuditPolling(pollIntervalMs = 3000) {
  const [logs, setLogs] = useState([]);
  const [metrics, setMetrics] = useState({ upsellConversion: 0, violationsPrevented: 0, aov: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      // Fetch logs first so they always appear even if metrics fail
      const fetchedLogs = await auditApi.getLogs();
      setLogs(fetchedLogs);
      
      try {
        const fetchedMetrics = await auditApi.getMetrics();
        setMetrics(fetchedMetrics);
      } catch (metricsErr) {
        console.warn('Metrics polling failed, but logs succeeded:', metricsErr);
      }
      
      setError(null);
    } catch (err) {
      console.error('Audit polling error:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(); // Initial fetch
    
    const intervalId = setInterval(fetchData, pollIntervalMs);
    
    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, [fetchData, pollIntervalMs]);

  return { logs, metrics, loading, error, refresh: fetchData };
}
