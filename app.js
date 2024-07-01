const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ = require("lodash");
const date = require(__dirname + "/date.js");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//Dont need flag anymore
mongoose.connect("mongodb+srv://admin-jett:adminpassword@cluster0.gg1bsoo.mongodb.net/todoListDB");

const itemsSchema = {
	Name: String
};

const Item = mongoose.model("Item", itemsSchema);

//Create default items
const item1 = new Item({
	Name: "Welcome to your todo list!"
});

const item2 = new Item({
	Name: "Hit the + button to add a new item."
});

const item3 = new Item({
	Name: "<-- Hit this button to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
	Name: String,
	items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);	

app.get("/", function(req, res) {
	let day = date.getDay();
	
	Item.find({})
		.then(function(foundItems) {
			//Add items if empty
			if (foundItems.length === 0) {
				Item.insertMany(defaultItems)
					.then(function() {
						console.log("Successfully saved default items to DB.");
					})
					.catch(function(err) {
						console.log(err);
					});
					
				res.redirect("/");
			}
			else
			{
			
				foundItems.forEach(function(item) {
					console.log(item.Name);
				});
			
				res.render("list", {listTitle: day, newListItems: foundItems});
			}
		});
});

app.post("/", function(req, res) {
	const itemName = req.body.newItem;
	const listName = req.body.list;
	
	const item = new Item({
		Name: itemName
	});
	
	if (listName === date.getDay()) {
		item.save();
		res.redirect("/");
	} else {
		List.findOne({Name: listName})
			.then(function(foundList) {
				foundList.items.push(item);
				foundList.save()
					.then(function() {
						res.redirect("/" + listName);
					});
			})
	}
});

app.post("/delete", function(req, res) {
	const checkedItemId = req.body.checkbox;
	const listName = req.body.listName;
	
	
	if (listName === date.getDay())
	{
		Item.findByIdAndDelete(checkedItemId)
			.then(function() {
				console.log("Successfully deleted checked item");
			})
			.catch(function(err) {
				console.log(err);
			});
			
		res.redirect("/");
	} else {
		List.findOneAndUpdate({Name: listName}, {$pull: {items: {_id: checkedItemId}}})
			.then(function(updatedList) {
				if (updatedList) {
					res.redirect("/" + listName);
				} else {
					console.log("List not found");
					res.redirect("/");
				}
			})
			.catch(function(err) {
				console.log(err);
				res.redirect("/");
			});
	}
});

app.get("/:customListName", function(req,res) {
	const customListName = _.capitalize(req.params.customListName);
	
	List.findOne({Name: customListName})
		//Step 1: See if list is created
		.then(function(foundList) {
			if (!foundList) {
				//Create new list
				const newList = new List({
					Name: customListName,
					items: defaultItems 
				});
				
				//Go to step 2
				return newList.save();
			//List is found
			} else {
				res.render("list", { listTitle: foundList.Name, newListItems: foundList.items });
			}
		})
		//Step 2: redirect to same directory with new list
		.then(function(savedList) {
			if (savedList) {
				console.log("New list created: " + customListName);
				res.redirect("/" + customListName);
			}
		})
		.catch(function(err) {
			console.log(err);
		});
	
});

app.get("/about", function(req, res) {
	res.render("about");
});

app.listen(process.env.PORT || 3000, function(){
	console.log('Server started on port 3000');
});