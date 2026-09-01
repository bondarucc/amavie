import prisma from "@/lib/prisma";
import Image from "next/image";
import { cacheLife, cacheTag, revalidateTag, updateTag } from "next/cache";
import {
  Template1,
  Template1Assets,
  Template2,
  Template2Assets,
} from "@amavie/shared";

import { ImageUpload } from "../../../../backoffice/src/app/cms/ImgUpload";
import { BlogPostModel, Templates } from "@amavie/database/browser";
import React from "react";
import styles from "./page.module.css";
import { cn } from "@/lib/utils";

type TemplateMapping = Omit<BlogPostModel, "template" | "assets"> &
  (
    | {
        template: typeof Templates.Template1;
        assets: Template1Assets;
      }
    | {
        template: typeof Templates.Template2;
        assets: Template2Assets;
      }
  );

export default async function BlogPage() {
  "use cache";

  cacheTag("blog-posts");
  cacheLife("minutes");

  const posts = (await prisma.blogPost.findMany({
    orderBy: {
      createdAt: "desc",
    },
  })) as TemplateMapping[];

  console.log(posts);

  return (
    <div className={cn("w-1/2 mx-auto flex flex-col gap-y-20", styles.blog)}>
      {posts.map((post) => {
        const tmpl = post.template;

        switch (tmpl) {
          case "Template1":
            return (
              <React.Fragment key={post.id}>
                <Template1
                  title={
                    <h2 className="text-center px-2.5 py-2">{post.title}</h2>
                  }
                  mainImg={
                    <Image
                      src={`/cms/images/${post.assets.mainImg}`}
                      alt={post.assets.mainImg}
                      fill
                      className="object-cover shadow-[0_2px_8px_rgba(0,0,0,0.12)]"
                      // sizes="(max-width: 768px) 30vw, 768px"
                      loading="eager"
                    />
                  }
                  body={<p>{post.assets.body}</p>}
                  secImgs={post.assets.secImgs.map((img) => (
                    <Image
                      src={`/cms/images/${img}`}
                      alt={img}
                      fill
                      className="object-cover"
                      // sizes="(max-width: 768px) 30vw, 768px"
                      loading="eager"
                    />
                  ))}
                  // key={post.id}
                />
                <img
                  src="/divider.svg"
                  // key={post.id}
                  className="mx-auto w-32 h-auto"
                />
              </React.Fragment>
            );

          case "Template2":
            return (
              <React.Fragment key={post.id}>
                <Template2
                  title={
                    <h2 className="text-center px-2.5 py-2">{post.title}</h2>
                  }
                  mainImg={
                    <Image
                      src={`/cms/images/${post.assets.mainImg}`}
                      alt={post.assets.mainImg}
                      fill
                      className="object-cover shadow-[0_2px_8px_rgba(0,0,0,0.12)]"
                      // sizes="(max-width: 768px) 30vw, 768px"
                      loading="eager"
                    />
                  }
                  body={<p>{post.assets.body}</p>}
                />
                <img
                  src="/divider.svg"
                  // key={post.id}
                  className="mx-auto w-32 h-auto"
                />
              </React.Fragment>
            );

          default:
            return null;
        }
      })}
    </div>
  );

  // return (
  //   <div>
  //     {posts.map((post) => (
  //       <article key={post.id} style={{ marginBottom: 40 }}>
  //         <h2 style={{ textAlign: "center", marginBottom: 15 }}>
  //           {post.title}
  //         </h2>

  //         <div style={{ position: "relative", aspectRatio: "16 / 9" }}>
  //           <Image
  //             src={post.image}
  //             alt={post.title}
  //             fill
  //             // style={{ objectFit: "contain" }}
  //             className="object-cover"
  //             // sizes="(max-width: 768px) 30vw, 768px"
  //             loading="eager"
  //           />
  //         </div>

  //         <div style={{ textAlign: "center" }}>{post.body}</div>
  //       </article>
  //     ))}
  //   </div>
  // );
}

// const foo =
//   "Lorem ipsum dolor sit amet consectetur, adipisicing elit. Odit ratione consectetur, nam incidunt ullam inventore possimus facilis iusto deleniti laboriosam vel porro debitis neque ipsum rerum tenetur adipisci voluptate eveniet?";

type Props = {
  img1: string;
  img2: string;
  // img3: string;
  // img4: string;
  // title: string;
  // body: string;
};

// function Template2({ img1, img2 }: Props) {
//   return (
//     <div className="gap-3 grid grid-cols-[repeat(4,1fr)] grid-rows-[repeat(2,350px)]">
//       <div className="relative bg-gray-200 col-span-3">
//         <ImageUpload name="test" />
//         {/* <Image
//           src={img1}
//           alt={img1}
//           fill
//           className="object-cover"
//           loading="eager"
//         /> */}
//       </div>
//       <div className="row-span-2">
//         Lorem ipsum dolor sit amet consectetur adipisicing elit. Facere aut
//         numquam nesciunt fugit magnam labore, tempore modi commodi animi
//         dignissimos quod optio vitae magni fugiat veniam voluptates, rerum
//         dolores. Eos. Lorem ipsum, dolor sit amet consectetur adipisicing elit.
//         Harum est, nesciunt quaerat quo, beatae obcaecati debitis necessitatibus
//         consequatur incidunt molestiae expedita. Asperiores mollitia blanditiis
//         commodi quisquam. Odit quidem labore cumque. Lorem ipsum dolor sit amet,
//         consectetur adipisicing elit. Ad animi nisi blanditiis ratione dicta!
//         Deleniti quis distinctio, dolorem voluptates in illum fuga quod
//         consequatur culpa provident suscipit quos officiis. Hic. Lorem ipsum
//         dolor sit amet consectetur adipisicing elit. Atque eum et praesentium,
//         quod sint temporibus voluptate sed nisi provident expedita animi veniam
//         laudantium omnis vitae laborum culpa soluta, at optio. Lorem ipsum
//         dolor, sit amet consectetur adipisicing elit. Error quisquam dolorum
//         nemo natus cum veniam quia, quidem alias ut accusantium incidunt
//         eligendi fuga dicta quos voluptas. Officiis esse voluptatem cupiditate.
//         Lorem ipsum dolor sit amet consectetur adipisicing elit. Impedit nobis
//         dolores laudantium reprehenderit repellat eos amet tempora commodi
//         adipisci. Numquam assumenda consequuntur tenetur totam minima ipsam nisi
//         porro quibusdam dignissimos? Lorem ipsum dolor sit amet consectetur
//         adipisicing elit. Velit, saepe. Odit magnam odio quisquam
//         exercitationem, veritatis magni eum qui omnis iste reprehenderit
//         voluptas vel. Ex nostrum inventore voluptate excepturi corporis?
//       </div>
//       <div className="relative">
//         <ImageUpload name="test" />
//         {/* <Image
//           src={img2}
//           alt={img2}
//           fill
//           // sizes="100px"
//           className="object-cover"
//           loading="eager"
//         /> */}
//       </div>
//       <div className="relative">
//         <Image
//           src={img2}
//           alt={img2}
//           fill
//           // sizes="100px"
//           className="object-cover"
//           loading="eager"
//         />
//       </div>
//       <div className="relative">
//         <Image
//           src={img2}
//           alt={img2}
//           fill
//           // sizes="100px"
//           className="object-cover"
//           loading="eager"
//         />
//       </div>
//     </div>
//   );
// }
