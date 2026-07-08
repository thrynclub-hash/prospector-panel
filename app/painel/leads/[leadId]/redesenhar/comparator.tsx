"use client";

import { ReactCompareSlider, ReactCompareSliderImage } from "react-compare-slider";
import type { RedesignContent } from "@/types/redesign-content";
import { RedesignPreview } from "./redesign-preview";

export function Comparator({ beforeUrl, content }: { beforeUrl: string | null; content: RedesignContent }) {
  return (
    <ReactCompareSlider
      style={{ height: "600px", borderRadius: "1rem", overflow: "hidden" }}
      itemOne={
        beforeUrl ? (
          <ReactCompareSliderImage src={beforeUrl} alt="Site antigo" style={{ objectFit: "cover", objectPosition: "top" }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-bad-bg text-bad text-sm">
            Sem site para comparar
          </div>
        )
      }
      itemTwo={
        <div className="w-full h-full overflow-y-auto bg-white">
          <RedesignPreview content={content} />
        </div>
      }
    />
  );
}
