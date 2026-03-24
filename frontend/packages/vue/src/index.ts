import {
  defineComponent,
  h,
  provide,
  inject,
  ref,
  onMounted,
  type Component,
  type PropType,
  type InjectionKey,
  type Ref,
} from 'vue';
import {
  FlexCmsClient,
  ComponentMapper,
  type FlexCmsConfig,
  type ComponentNode,
  type PageResponse,
} from '@flexcms/sdk';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Vue component that renders a CMS component's data */
export type FlexCmsVueRenderer = Component<{ data: Record<string, unknown> }>;

export interface FlexCmsVueContext {
  client: FlexCmsClient;
  mapper: ComponentMapper<FlexCmsVueRenderer>;
}

// ---------------------------------------------------------------------------
// Injection key
// ---------------------------------------------------------------------------

export const FLEXCMS_KEY: InjectionKey<FlexCmsVueContext> = Symbol('flexcms');

export function useFlexCms(): FlexCmsVueContext {
  const ctx = inject(FLEXCMS_KEY);
  if (!ctx) throw new Error('useFlexCms() requires a <FlexCmsProvider> ancestor');
  return ctx;
}

// ---------------------------------------------------------------------------
// Plugin
// ---------------------------------------------------------------------------

export interface FlexCmsPluginOptions {
  client: FlexCmsClient | FlexCmsConfig;
  componentMap: ComponentMapper<FlexCmsVueRenderer>;
}

export const FlexCmsPlugin = {
  install(app: any, options: FlexCmsPluginOptions) {
    const client =
      options.client instanceof FlexCmsClient
        ? options.client
        : new FlexCmsClient(options.client);

    app.provide(FLEXCMS_KEY, { client, mapper: options.componentMap });
  },
};

// ---------------------------------------------------------------------------
// FlexCmsComponent
// ---------------------------------------------------------------------------

export const FlexCmsComponent = defineComponent({
  name: 'FlexCmsComponent',
  props: {
    node: { type: Object as PropType<ComponentNode>, required: true },
  },
  setup(props, { slots }) {
    const { mapper } = useFlexCms();

    return () => {
      const Renderer = mapper.resolve(props.node.resourceType);
      if (!Renderer) {
        return h('div', { 'data-flexcms-missing': props.node.resourceType }, [
          `Unknown component: ${props.node.resourceType}`,
        ]);
      }

      const children = props.node.children?.map((child) =>
        h(FlexCmsComponent, { node: child, key: child.name })
      );

      return h(Renderer, { data: props.node.data }, () => children);
    };
  },
});

// ---------------------------------------------------------------------------
// FlexCmsPage
// ---------------------------------------------------------------------------

export const FlexCmsPage = defineComponent({
  name: 'FlexCmsPage',
  props: {
    pageData: { type: Object as PropType<PageResponse>, required: true },
  },
  setup(props) {
    return () =>
      h(
        'div',
        { 'data-flexcms-page': props.pageData.page.path },
        props.pageData.components.map((node) =>
          h(FlexCmsComponent, { node, key: node.name })
        )
      );
  },
});

// ---------------------------------------------------------------------------
// useFlexCmsPage composable
// ---------------------------------------------------------------------------

export function useFlexCmsPage(
  path: string,
  options?: { site?: string; locale?: string }
) {
  const { client } = useFlexCms();
  const pageData = ref<PageResponse | null>(null) as Ref<PageResponse | null>;
  const loading = ref(true);
  const error = ref<Error | null>(null);

  onMounted(async () => {
    try {
      pageData.value = await client.getPage(path, options);
    } catch (e) {
      error.value = e instanceof Error ? e : new Error(String(e));
    } finally {
      loading.value = false;
    }
  });

  return { pageData, loading, error };
}

// ---------------------------------------------------------------------------
// Re-exports
// ---------------------------------------------------------------------------

export { FlexCmsClient, ComponentMapper } from '@flexcms/sdk';
export type { PageResponse, ComponentNode, NavigationItem, FlexCmsConfig } from '@flexcms/sdk';

