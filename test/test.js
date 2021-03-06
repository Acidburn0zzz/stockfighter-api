"use strict";

let apiKey;

if(process.env.STOCKFIGHTER_API_KEY) {
    apiKey = process.env.STOCKFIGHTER_API_KEY;
} else {
    try {
        require("dotenv").load();

        if(!process.env.STOCKFIGHTER_API_KEY)
            throw null;

        apiKey = process.env.STOCKFIGHTER_API_KEY;
    } catch(err) {
        console.log("missing environmental variable: STOCKFIGHTER_API_KEY");
        process.exit();
    }
}

console.log("note: as of 2015-12-16 orders.list with test account 401s no matter what");

const Promise = require("bluebird");
const test = require("unit.js");

const body = {
    qty: 100,
    price: 8000,
    orderType: "market" 
};

const defaults = {
    account: "EXB123456",
    venue: "TESTEX",
    stock: "FOOBAR"
};

const client = require("../client.js")(apiKey, defaults);

//PROTIP catch => reject just because mocha whines about my normal objects
const yay = data =>
    test.assert(data.ok === true);
const boo = err =>
    Promise.reject(new Error(err.type));
const wat = data =>
    console.log("\n", JSON.stringify(data, null, "\t"));
const shh = (data, keys) => {
    for(let key of keys) {
        data[key] = data[key].slice(0,2);
    }

    return data;
};
const stfu = data => {
    data.instructions = { Instructions: "snip" };

    return data;
};

let order;
let level;

//TODO ypypypyp lol consolidate more imo
describe("REST api", () => {
    it("client.heartbeat.api", () =>
        client.heartbeat.api()
            .tap(wat)
            .then(yay)
            .catch(boo));

    it("client.heartbeat.venue", () =>
        client.heartbeat.venue()
            .tap(wat)
            .then(yay)
            .catch(boo));

    it("client.stock.list", () =>
        client.stock.list()
            .tap(wat)
            .then(yay)
            .catch(boo));

    it("client.stock.book", () =>
        client.stock.book()
            .then(data => shh(data, ["bids", "asks"]))
            .tap(wat)
            .then(yay)
            .catch(boo));

    it("client.stock.quote", () =>
        client.stock.quote()
            .tap(wat)
            .then(yay)
            .catch(boo));

    it("client.stock.orders", () =>
        client.stock.orders()
            .then(data => shh(data, ["orders"]))
            .tap(wat)
            .then(yay)
            .catch(boo));

    it("client.order.list", () =>
        client.order.list()
            .then(data => shh(data, ["orders"]))
            .tap(wat)
            .then(yay)
            .catch(boo));

    it("client.order.bid", () =>
        client.order.bid(body)
            .tap(wat)
            .then(yay)
            .catch(boo));

    it("client.order.ask", () => {
        order = client.order.ask(body);

        return order
            .tap(wat)
            .then(yay)
            .catch(boo)
    });

    it("client.order.status", () =>
        order.then(data => client.order.status(data.id))
            .tap(wat)
            .then(yay)
            .catch(boo));

    it("client.order.cancel", () =>
        order.then(data => client.order.cancel(data.id))
            .tap(wat)
            .then(yay)
            .catch(boo));

    it("client.level.start", () => {
        level = client.level.start(0);

        return level
            .then(stfu)
            .tap(wat)
            .then(yay)
            .catch(boo)
    });

    it("client.level.status", () =>
        level.then(data => client.level.status(data.instanceId))
            .tap(wat)
            .then(yay)
            .catch(boo));

    it("client.level.resume", () =>
        level.then(data => client.level.resume(data.instanceId))
            .then(stfu)
            .tap(wat)
            .then(yay)
            .catch(boo));

    //FIXME this sloppy nonsense works because of mocha's serial execution
    //eventually prolly want to switch to a testrunner that executes in parallel
    //testing a bunch of REST calls serially is dumb and the async I write is solid
    //but for these the flow I want is... start => (status && resume) => restart => stop
    it("client.level.restart", function() {
        this.timeout(10000);

        return level.then(data => client.level.restart(data.instanceId))
            .then(stfu)
            .tap(wat)
            .then(yay)
            .catch(boo)
    });

    it("client.level.stop", () =>
        level.then(data => client.level.stop(data.instanceId))
            .tap(wat)
            .then(yay)
            .catch(boo));
});
