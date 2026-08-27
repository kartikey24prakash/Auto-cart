"use client";

import NumberFlow from "@number-flow/react";
import React from "react";

const Skiper37 = ({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) => {
  return (
    <NumberFlow 
      value={value} 
      prefix={prefix} 
      suffix={suffix} 
    />
  );
};

export { Skiper37 };
