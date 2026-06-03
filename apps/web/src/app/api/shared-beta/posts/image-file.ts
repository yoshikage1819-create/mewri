import type { SharedBetaPostImageFile } from "@mewri/data/src/supabase-post-image-storage";

export const SHARED_BETA_POST_IMAGE_FORM_FIELD = "image";

export function formValueToSharedBetaPostImageFile(
  value: FormDataEntryValue | null
): SharedBetaPostImageFile | undefined {
  if (!value || typeof value === "string") {
    return undefined;
  }

  return {
    name: value.name,
    type: value.type,
    size: value.size,
    arrayBuffer() {
      return value.arrayBuffer();
    }
  };
}
