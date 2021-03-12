const PENDING = 'pending';
const FULFILLED = 'fulfilled';
const REJECTED = 'rejected';

class NPromise{

    constructor(executor){
        this.status = PENDING;
        this.onFulfilledFns = [];
        this.onRejectedFns = [];
        executor(this.resolve, this.reject)
    }

    static resolve(value){
        return new NPromise((resolve, reject) => {
            resolve(value)
        })
    }

    static reject(reason){
        return new NPromise((resolve, reject) => {
            reject(reason)
        })
    }

    resolvePromise = (value, fn) => {
        const d = {};
        const promise = new NPromise((resolve, reject) => {
            d.resolve = resolve;
            d.reject = reject;
        })

        process.nextTick(() => {
            try{
                d.resolve(fn(value))
            }catch (e) {
                d.reject(e)
            }

        })
        return promise;
    }


    // when resolving x
    // if x is a promise, pass resolve to x.then
    // if x is a thenable , call x.then with resolve and reject
    // otherwise change the status of this promise and call the callback
    resolve = (value) => {
        if(value === this){
            this.reject(new TypeError('can not resolve itself'))
        }
        if(this.status === PENDING){
            if(value instanceof NPromise){
                value.then(this.resolve, this.reject)
            }else{
                if(value && (typeof value === 'object' || typeof value === 'function')){
                    let then;
                    try{
                        then = value.then;
                        if(typeof then === 'function'){
                            // resolve 和 reject只能调用一次
                            // resolve and reject can only be called once
                            // once resolve or reject is called, ignore the rest calls
                            let resolved = false;
                            let rejected = false;
                            try{
                                then.call(value, (v) => {
                                    if(!resolved && !rejected){
                                        resolved = true
                                        this.resolve(v)
                                    }
                                },(e) => {
                                    if(!rejected && !resolved){
                                        rejected = true
                                        this.reject(e)
                                    }
                                })
                            }catch (e) {
                                if(!resolved && !rejected){
                                    this.reject(e)
                                }
                            }
                            return
                        }
                    }catch (e) {
                        this.reject(e)
                        return
                    }
                }
                this.status = FULFILLED;
                this.value = value;
                process.nextTick(() => {
                    this.onFulfilledFns.forEach(fn => {
                        try{
                            fn(value)
                        }catch(e){

                        }
                    })
                })
            }
        }
    }

    reject = (reason) => {
        if(this.status === PENDING){
            this.status = REJECTED
            this.reason = reason
            process.nextTick(() => {
                this.onRejectedFns.forEach(fn => {
                    try{
                        fn(reason)
                    }catch(e){
                    }
                })
            })
        }
    }

    then = (onFulfilled, onRejected) => {
        if(this.status === PENDING){
            const d = {};
            const promise = new NPromise((resolve, reject) => {
                d.resolve = resolve;
                d.reject = reject;
            })

            this.onFulfilledFns.push((v) => {
                if(typeof onFulfilled === 'function'){
                    try{
                        const res = onFulfilled(v)
                        d.resolve(res)
                    }catch (e){
                        d.reject(e)
                    }
                }else{
                    d.resolve(v)
                }
            })

            this.onRejectedFns.push((reason) => {
                try {
                    if(typeof onRejected === 'function'){
                        const res = onRejected(reason)
                        d.resolve(res)
                    }else{
                        d.reject(reason)
                    }
                }catch (e) {
                    d.reject(e)
                }
            })
            return promise
        }else if (this.status === FULFILLED){
            if(typeof onFulfilled === 'function'){
                return this.resolvePromise(this.value, onFulfilled)
            }else{
                return this
            }

        }else if(this.status === REJECTED){
            if(typeof onRejected === 'function'){
                return this.resolvePromise(this.reason, onRejected)
            }else{
                return this
            }
        }

    }

    catch = (onRejected) => {
        return this.then(null, onRejected)
    }
}

module.exports = NPromise
