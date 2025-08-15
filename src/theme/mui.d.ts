import "@mui/material/Button";

declare module "@mui/material/Button" {
  interface ButtonPropsVariantOverrides {
    large: true;
    small: true;
    rounded: true;
    glass: true;
    gradientOutlined: true;
    neon: true;
    minimal: true;
  }
}
