/**
 * Vue language tools emit both kebab + camel for native attrs.
 * DOM attribute interfaces only declare kebab keys — allow camel aliases.
 */
declare module 'vue' {
  interface HTMLAttributes {
    ariaLabel?: string;
    ariaHidden?: boolean | 'true' | 'false';
    dataTauriDragRegion?: boolean | '';
  }

  interface ButtonHTMLAttributes {
    ariaLabel?: string;
  }

  interface SVGAttributes {
    ariaHidden?: boolean | 'true' | 'false';
    strokeWidth?: number | string;
  }
}

export {};
