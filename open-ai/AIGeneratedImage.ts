class AIGeneratedImage {
  readonly width: number;
  readonly height: number;
  readonly b64: string;
  readonly name: string;
  readonly fileName: string;
  readonly fileNameWithGuid: string;

  constructor(name: string, b64 = "", width = 1024, height = 1024) {
    this.name = name;
    this.b64 = b64;
    this.width = width;
    this.height = height;
    this.fileName = name.replaceAll(" ", "_");
    this.fileNameWithGuid = `${this.fileName}_${crypto.randomUUID()}`;
  }

  toBlob(): Blob {
    const bytes = Uint8Array.from(atob(this.b64), (c) => c.charCodeAt(0));
    return new Blob([bytes], { type: "image/png" });
  }
}

export default AIGeneratedImage;
