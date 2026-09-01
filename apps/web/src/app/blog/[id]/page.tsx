import { Suspense } from "react";
import { cacheTag } from "next/cache";
import { notFound } from "next/navigation";

import { getPost } from "../../../mock/posts";

export default function PostPage({ params }: PageProps<"/blog/[id]">) {
  console.log("running PostPage");

  return (
    <Suspense fallback={<p>Loading...</p>}>
      <PostContent params={params} />
    </Suspense>
  );
}

async function PostContent({
  params,
}: {
  params: PageProps<"/blog/[id]">["params"];
}) {
  console.log("running PostContent");

  const { id } = await params;

  return <CachedPost id={id} />;
}

async function CachedPost({ id }: { id: string }) {
  "use cache";

  console.log("running CachedPost " + id);

  cacheTag(`post:${id}`);

  const post = await getPost(id);

  if (!post) {
    notFound();
  }

  return (
    <main>
      <h1>{post.title}</h1>
      <p>{post.body}</p>
    </main>
  );
}
