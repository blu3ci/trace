declare module "html-to-pdf-js" {
  const htmlToPdf: (
    html: string,
    options?: Record<string, unknown>,
  ) => Promise<{
    save: () => void;
  }>;

  export default htmlToPdf;
}
