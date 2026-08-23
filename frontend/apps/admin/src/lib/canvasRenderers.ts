/**
 * The renderer registry the editor canvas draws with.
 *
 * It is the *same* registry the public site uses — `@flexcms/site-renderers` — so a
 * component looks in the editor exactly as it will once published. The editor
 * previously carried its own hand-written previews, which is why authors saw grey
 * boxes labelled "Product Grid 1" for components the site renders as real product
 * grids.
 *
 * The contracts are supplied here because the package deliberately takes them as
 * input rather than assuming a path on disk; this is the admin app's copy of that
 * wiring, matching `component-map.tsx` in the site app.
 */
import componentContracts from '../../../../../Design/tut-usa/generated/component-contracts.json';
import { createTutComponentMap, type TutComponentContract } from '@flexcms/site-renderers';

export const canvasComponentMap = createTutComponentMap(
  componentContracts as TutComponentContract[],
);
