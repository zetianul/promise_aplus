const NPromise = require('./NPromise')

const deferred = () => {
    const dtd = {}
    dtd.promise = new NPromise((resolve, reject) => {
        dtd.resolve = resolve;
        dtd.reject = reject
    })
    return dtd
}

module.exports = {
    deferred,
    resolved: function(value){
        const d = deferred()
        d.resolve(value);
        return d.promise;
    },
    rejected: function(reason){
        const d = deferred();
        d.reject(reason);
        return d.promise
    },
    NPromise,
}
