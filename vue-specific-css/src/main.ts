import Vue, {
    PluginObject,

    CreateElement,
    VNodeData,
    VNodeChildren
} from 'vue';

declare module 'vue/types/vue' {
    interface Vue {
        _c?: CreateElement;
        $styleMapping?: (name: string) => string;
    }
}

export interface ExtendedVue extends Vue {
    $style?: { [name: string]: string };
}

const mixin = {
    beforeCreate: function (this: ExtendedVue) {
        if (this._c)
            this._c = wrapCreateElement(this, this._c);

        this.$createElement = wrapCreateElement(this, this.$createElement);
        this.$styleMapping = name => this.$style ? map(name, this.$style) : name;
    },
};

const plugin: PluginObject<typeof Vue> = {
    install(vue) {
        Vue.mixin(mixin);
    }
};

export default plugin;

function wrapCreateElement(self: ExtendedVue, oldCreate: CreateElement): CreateElement {
    return function (tag?: any, data?: VNodeData | VNodeChildren, children?: VNodeChildren) {
        if (data && self.$style) {
            apply(data, 'class', self.$style);
            apply(data, 'staticClass', self.$style);
        }

        return oldCreate.apply(self, arguments);
    };
}

function apply(data: any, key: string | number, style: any) {
    let value = data[key];
    if (!value) return;

    if (typeof value == 'string') {
        data[key] = value.split(/\s/)
            .filter(a => a)
            .map(name => map(name, style))
            .join(' ');

        return;
    }

    if (value instanceof Array) {
        for (let i = 0; i < value.length; i++) {
            apply(value, i, style);
        }

        return;
    }

    let mapped: any = {};
    for (let name in value) {
        mapped[map(name, style)] = value[name];
    }
    data[key] = mapped;
}

function map(name: string, style: any) {
    let hash = style[name];
    if (!hash) return name;

    return hash;
}
