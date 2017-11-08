declare global {
    interface PromiseConstructor {
        // each<T, R>(callback: (t: T) => R | Promise<R>): (src: T[]) => Promise<R[]>;
        /**
         * Sequentially
         */
        each<T, R>(list: T[], callback: (t: T) => R | Promise<R>): Promise<R[]>;
        each<T, V>(list: T[], first: V, callback: (t: T) => V | Promise<V>): Promise<V>;

        /**
         * In parrallel
         */
        every<T, R>(list: T[], callback: (t: T) => R | Promise<R>): Promise<R[]>;
    }

    interface Promise<T> {
        /**
         * Sequentially
         */
        each<K extends number & keyof T, R>(callback: (t: T[K]) => R | Promise<R>): Promise<R[]>

        /**
         * In parrallel
         */
        every<K extends number & keyof T, R>(callback: (t: T[K]) => R | Promise<R>): Promise<R[]>

        finally<TResult1 = T, TResult2 = never>(callback: (() => TResult1 | PromiseLike<TResult1>) | undefined | null): Promise<TResult1 | TResult2>;
    }
}

export default function install(Promise: any) {
    Promise.each = function each<T>(list: T[], one?: any, two?: any) {
        const impl = typeof two == 'function' ? 2 : 1;

        let outcome: any;
        if (impl == 2)
            outcome = two;
        else
            outcome = [];

        let queue = list.slice();

        function helper(): Promise<any> {
            let item = queue.shift();
            if (!item) return outcome;

            let temp = Promise.resolve(impl == 2 ? two(item, outcome) : one(item));

            return temp.then((v: any) => {
                if (impl == 2)
                    outcome = v;
                else
                    outcome.push(v);

                return helper();
            });
        }

        return Promise.resolve().then(helper);
    };

    Promise.every = function every<T, R>(list: T[], mapping: (t: T) => R | Promise<R>) {
        return Promise.all(list.map(mapping));
    };

    Promise.prototype.each = function each<T, R>(this: Promise<T[]>, callback: (t: T) => R | Promise<R>) {
        return this.then(list => Promise.each(list, callback));
    };

    Promise.prototype.every = function every<T, R>(this: Promise<T[]>, callback: (t: T) => R | Promise<R>) {
        return this.then(list => Promise.every(list, callback));
    };

    Promise.prototype.finally = function <T, TResult1 = T, TResult2 = never>(this: Promise<T>, callback: (() => TResult1 | PromiseLike<TResult1>) | undefined | null): Promise<TResult1 | TResult2> {
        return this.then(callback, callback);
    }
}
