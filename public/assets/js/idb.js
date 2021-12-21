// create a variable to hold db connection
let db;
// establish a connection to IndexedDB database called 'pizza-hunt' - set to v1
const request = indexedDB.open('pizza-hunt', 1);

// event will emit if db version changes
request.onupgradeneeded = function(event){
    // save a reference to the db
    const db = event.target.result;
    // create object store set to have auto inc primary key
    db.createObjectStore('new_pizza', { autoIncrement: true });
};


// upon a successful
request.onsuccess = function(event){
    // when db is created, save reference to db
    db = event.target.result;

    // check if app is online
    if(navigator.onLine){
        uploadPizza();
    }
};

request.onerror = function(event){
    // log error here
    console.log(event.target.errorCode);
};

// executed if attempt to submit pizza with no internet
function saveRecord(record){
    // open a new transaction with the db with read/write permissions
    const transaction = db.transaction(['new_pizza'], 'readwrite');

    // acces object store for `new_pizza`
    const pizzaObjectStore = transaction.objectStore('new_pizza');

    // add record to store
    pizzaObjectStore.add(record);
};

function uploadPizza(){
    // open a transaction on your db
    const transaction = db.transaction(['new_pizza'], 'readwrite');

    const pizzaObjectStore = transaction.objectStore('new_pizza');

    // get all records from store and set to a variable
    const getAll = pizzaObjectStore.getAll();

    getAll.onsuccess = function(){
        // if there was data in indexedDb's store, let's send it to the api server
        if (getAll.result.length > 0) {
            fetch('/api/pizzas', {
            method: 'POST',
            body: JSON.stringify(getAll.result),
            headers: {
                Accept: 'application/json, text/plain, */*',
                'Content-Type': 'application/json'
            }
            })
            .then(response => response.json())
            .then(serverResponse => {
                if (serverResponse.message) {
                throw new Error(serverResponse);
                }
                // open one more transaction
                const transaction = db.transaction(['new_pizza'], 'readwrite');
                // access the new_pizza object store
                const pizzaObjectStore = transaction.objectStore('new_pizza');
                // clear all items in your store
                pizzaObjectStore.clear();
    
                alert('All saved pizza has been submitted!');
            })
            .catch(err => {
                console.log(err);
            });
        }
}
};

// listen for app coming back online
window.addEventListener('online', uploadPizza);