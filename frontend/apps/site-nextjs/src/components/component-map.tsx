/**
 * Reference site component map.
 *
 * The renderers themselves live in `@flexcms/site-renderers`, shared with the admin
 * editor so the editing canvas renders exactly what this site renders. All this file
 * does is supply the generated contracts for this particular site — the package
 * deliberately takes them as input rather than reaching for a path on disk.
 */
'use client';

import componentContracts from '../../../../../Design/tut-usa/generated/component-contracts.json';
import { createTutComponentMap, type TutComponentContract } from '@flexcms/site-renderers';

export const componentMap = createTutComponentMap(componentContracts as TutComponentContract[]);
