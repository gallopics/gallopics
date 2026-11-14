/** A short, stable code for a photo (from its ID), e.g. "#3F2A9C1B" */
export const shortPhotoId = (photoId: string) =>
  `#${photoId.slice(0, 8).toUpperCase()}`
