import type { ReactNode } from "react";
import TemplateWrapper from "./TemplateWrapper";

export type Template2Assets = {
  mainImg: string;
  body: string;
};

type Props = { title: ReactNode } & {
  [K in keyof Template2Assets]: ReactNode;
};

export function Template2({ title, mainImg, body }: Props) {
  return (
    <TemplateWrapper>
      <div className="space-y-4">
        <div className="aspect-video relative">{mainImg}</div>
        <div className="text-[1.25em]">{title}</div>
        {body}
      </div>
    </TemplateWrapper>
  );
}
