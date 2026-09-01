import type { ReactNode } from "react";
import TemplateWrapper from "./TemplateWrapper";

export type Template1Assets = {
  mainImg: string;
  secImgs: [string, string, string];
  body: string;
};

type Props = { title: ReactNode } & {
  [K in keyof Template1Assets]: Template1Assets[K] extends Array<infer T>
    ? Array<ReactNode>
    : ReactNode;
};

export function Template1({ title, mainImg, body, secImgs }: Props) {
  return (
    <TemplateWrapper>
      <div
        className="grid grid-cols-[repeat(3,1fr)_2fr] grid-rows-[40cqw_40cqw] gap-3"
        style={{
          gridTemplateAreas: `
        "mainImg mainImg mainImg body"
        "secImg1 secImg2 secImg3 body"
        `,
        }}
      >
        <div className="[grid-area:mainImg] relative ">{mainImg}</div>
        <div className="[grid-area:secImg1] relative ">{secImgs[0]}</div>
        <div className="[grid-area:secImg2] relative ">{secImgs[1]}</div>
        <div className="[grid-area:secImg3] relative ">{secImgs[2]}</div>
        <div className="[grid-area:body] pl-2 flex flex-col gap-4 overflow-hidden">
          <div className="text-[1.25em] shrink-0">{title}</div>
          {body}
          {/* <div></div> */}
        </div>
      </div>
    </TemplateWrapper>
  );
}
