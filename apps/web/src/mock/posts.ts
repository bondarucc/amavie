import "server-only";

export type Post = {
  id: string;
  title: string;
  body: string;
};

const posts = new Map<string, Post>();

export function savePost(post: Post) {
  posts.set(post.id, post);
}

export function getPost(id: string) {
  return posts.get(id);
}
