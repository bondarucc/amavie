"use client";

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ImageUpload } from "./ImgUpload";
import { Template1, Template2 } from "@amavie/shared";
import { Textarea } from "@/components/ui/textarea";
import { createBlogPost } from "./action";
import { Button } from "@/components/ui/button";
import { Templates } from "@amavie/database/browser";
import { useState } from "react";
import { formPaths } from "./const";

// const TemplateToComponentMapper: Record<Templates, React.FC> = {
//   Template1: Template1
// }

export default function BlogPostCreate() {
  const [template, setTemplate] = useState<Templates>(Templates.Template2);
  return (
    <div>
      <form action={createBlogPost} className="flex gap-4">
        <div>
          <RadioGroup
            className="max-w-sm"
            value={template}
            name="template"
            onValueChange={setTemplate}
          >
            <FieldLabel htmlFor={Templates.Template1}>
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldTitle>Шаблон 1</FieldTitle>
                  <FieldDescription>
                    1 большое изображение, 3 маленьких вертикальных, заголовок,
                    тело поста
                  </FieldDescription>
                </FieldContent>
                <RadioGroupItem
                  value={Templates.Template1}
                  id={Templates.Template1}
                  className="sr-only"
                />
              </Field>
            </FieldLabel>
            <FieldLabel htmlFor={Templates.Template2}>
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldTitle>Шаблон 2</FieldTitle>
                  <FieldDescription>
                    Одно большое изображение, заголовок, тело поста
                  </FieldDescription>
                </FieldContent>
                <RadioGroupItem
                  value={Templates.Template2}
                  id={Templates.Template2}
                  className="sr-only"
                />
              </Field>
            </FieldLabel>
          </RadioGroup>
        </div>

        <div className="space-y-6 w-[50vw]">
          {template === Templates.Template1 && (
            <Template1
              mainImg={
                // <div className="size-full border-2 rounded-(--radius) border-dashed">
                <ImageUpload name={formPaths.mainImg} />
                // </div>
              }
              title={
                <Textarea
                  id={"title"}
                  name={"title"}
                  className="text-center md:text-[1em]"
                  placeholder="[Заголовок]"
                  required
                />
              }
              body={
                <Textarea
                  id={formPaths.body}
                  name={formPaths.body}
                  className={"grow md:text-[1em] overflow-clip"}

                  required
                />
              }
              secImgs={[
                <ImageUpload name={formPaths.secImg1} />,
                <ImageUpload name={formPaths.secImg2} />,
                <ImageUpload name={formPaths.secImg3} />,
              ]}
            />
          )}
          {template === Templates.Template2 && (
            <Template2
              title={
                <Textarea
                  id={"title"}
                  name={"title"}
                  className="text-center md:text-[1em]"
                  placeholder="[Заголовок]"
                  required
                />
              }
              mainImg={<ImageUpload name={formPaths.mainImg} />}
              body={
                <Textarea
                  id={formPaths.body}
                  name={formPaths.body}
                  className={"grow md:text-[1em] overflow-clip"}
                  required
                />
              }
            />
          )}
          <Button type="submit">Опубликовать</Button>
        </div>
      </form>
    </div>
  );
}
