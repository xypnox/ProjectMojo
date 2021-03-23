# Template Guide

- The templates must be SVG.

- The variables must be surrounded by two curly brackets with no spaces.

  Ex. `{{name}}` & `{{Organization}}`

- Three images can be used for customization:

  - `mojo_var_logo`

    For logos

  - `mojo_var_placeholder`

    For a primary image in the foreground

  - `mojo_var_background`

    For an image in the background

  These specific names should be set in the id attribute of the respective image elements. Sometimes the id is used to declare viewboxes and sizes in the svg, therefore it is recommended to do a find and replace rather than manually changing the id attribute.

- The template can use any number of colors and images but only the following colors will be detected as editable:

  - `#57C8B4`
  - `#F8CC48`
  - `#EC407D`

  If these hex values are present in any of the gradients, strokes, fills etc, they will be editable as well.

  To make different editable shades of the same colors, you can use elements on top of these colors with different opacities to allow similar shades to be editable as well.

  HSL, RGB, RGBA variants of these colors are not considered editable and will not be detected by the editor.
