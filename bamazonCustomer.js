var mysql = require('mysql');
var inquirer = require('inquirer');
var colors = require('colors');

class Database {
  constructor(config) {
    this.connection = mysql.createConnection(config);
  }
  query(sql, args) {
    return new Promise((resolve, reject) => {
      this.connection.query(sql, args, (err, results) => {
        if (err)
          return reject(err);
        resolve(results);
      });
    });
  }
  close() {
    return new Promise((resolve, reject) => {
      this.connection.end(err => {
        if (err) {
          console.log("This is the error!");
          return reject(err);
        }
        resolve();
      });
    });
  }
}
let bamazon = new Database({
  host: "localhost",
  user: "root",
  password: "root",
  database: "bamazon"
});
start();
function start() {
  let bamaQuery = 'SELECT * FROM products';

  bamazon.query(bamaQuery).then(newQuery => {
    chooseQuestions(newQuery);
  })
}

function chooseQuestions(results) {
  let listOfIds = [];
  for (let i = 0; i < results.length; i++) {
    listOfIds.push(results[i].item_id.toString());
    console.log(`Id: ${results[i].item_id}, Item Name: ${results[i].product_name}, Price: ${results[i].price_retail}`);
  }
  inquirer.prompt([
    {
      type: "list",
      name: "choice",
      message: "Which product would you like to purchase?",
      choices: listOfIds
    },
    {
      type: "input",
      name: "amount",
      message: "How many would you like to purchase?"
    }]).then(function (res) {
      purchaseProduct(res.choice, res.amount);
    })

}

function purchaseProduct(choice, amount) {
  choice = parseInt(choice);
  amount = parseInt(amount);
  bamazon.query(`SELECT * FROM products WHERE item_id = ${choice}`).then(results => {
    let currentPurchaseTotal = results[0].product_sales;
    if (results[0].stock_quantity >= amount) {
      let stockLeft = (results[0].stock_quantity - amount);
      let cost = (results[0].price_retail * amount);
      let purchaseQty = (results[0].qty_purchaced + amount)
      calculateTransaction(results[0].product_name, choice, stockLeft, cost, currentPurchaseTotal, purchaseQty, amount)
    } else {
      console.log("Im sorry, there is not enough left in stock, please try again!".red);
      start();
    }
  })
}

function calculateTransaction(item, choice, stockLeft, cost, currentPurchaseTotal, purchaseQty, amount) {
  bamazon.query(`Update products SET ? WHERE item_id = ${choice}`,
    {
      stock_quantity: stockLeft,
      product_sales: cost + currentPurchaseTotal,
      qty_purchaced: purchaseQty
    }
  ).then(rows => {
    cost = cost.toFixed(2);
    console.log(`You successfully purchased ${item}(s) for $${cost}`.green);
    start();
  })
}
