"use client";

import dynamic from "next/dynamic";

export const ReceiptPreview = dynamic(() => import("./ReceiptPreview"), { ssr: false });
