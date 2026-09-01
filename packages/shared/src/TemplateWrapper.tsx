import { PropsWithChildren } from "react";

export default function TemplateWrapper({ children }: PropsWithChildren) {
  return (
    <div className="@container w-full">
      <article className="text-[1.8cqw]">{children}</article>
    </div>
  );
}
