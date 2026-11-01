declare module '*.scss' {
  const content: Record<string, string>
  // eslint-disable-next-line import/no-unused-modules
  export default content
}

declare module '*.css' {
  const content: Record<string, string>
  // eslint-disable-next-line import/no-unused-modules
  export default content
}

declare module '*.svg' {
  const content: string
  // eslint-disable-next-line import/no-unused-modules
  export default content
}

declare module '*.jpg' {
  const content: string
  // eslint-disable-next-line import/no-unused-modules
  export default content
}

declare module '*.jpeg' {
  const content: string
  // eslint-disable-next-line import/no-unused-modules
  export default content
}

declare module '*.png' {
  const content: string
  // eslint-disable-next-line import/no-unused-modules
  export default content
}

declare module '*.gif' {
  const content: string
  // eslint-disable-next-line import/no-unused-modules
  export default content
}

declare module '*.webp' {
  const content: string
  // eslint-disable-next-line import/no-unused-modules
  export default content
}

interface ImportMeta {
  readonly env: Record<string, string>;
  readonly require: (src?: string) => any
}
