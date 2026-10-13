# Header service icons

Original 3D assets generated with the built-in image-generation tool are retained unchanged for reference, including transparency. The header now uses decorative Lucide outline SVGs and does not load these PNG files.

Files:

- `training-3d.png`: training courses
- `consulting-3d.png`: ServiceNow Implementation
- `applications-3d.png`: Custom Applications
- `recruitment-3d.png`: staffing services

## Exact prompt set

Each image used this shared prompt followed by its subject below:

> Use case: stylized-concept. Asset type: small service icon for Entrolix website navigation on white. Create one realistic premium 3D object with simple readable silhouette, rounded bevels, dark forest green enamel, pale sage accents and brushed silver edges. Isometric three-quarter front view, soft studio light from upper left, realistic highlights and subtle contact shadow. Centered square composition, object fills 85% of canvas. Genuine transparent background. No text, letters, numbers, logos, watermark, extra scenery or background tile. Must remain recognizable at 48 pixels.

- Training: `Subject: a single open book with a small graduation cap resting above it.`
- Consulting: `Subject: a single compact cloud-shaped platform with a small gear inset in its front.`
- Applications: `Subject: four rounded modular blocks forming an elegant application grid, one block slightly elevated.`
- Recruitment: `Subject: three abstract human bust figures, the center figure forward and slightly larger, as a sculptural team symbol.`

All four calls requested `transparent_background: true`. The company logo was not regenerated or altered; its existing wordmark is presented through a CSS viewport in the header.
