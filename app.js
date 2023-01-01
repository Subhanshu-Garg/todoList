//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.set("view engine","ejs");

// var tasks = ["Buy Food","Cook Food","Eat Food" ];
// var workTasks = [];
mongoose.set('strictQuery',false);
mongoose.connect("mongodb+srv://admin-subhanshu:JoszyVeFqJX5QQLh@cluster0.slhvjmc.mongodb.net/todolistDB");

const itemSchema = {
    name: String,
};

const Item = mongoose.model("Item", itemSchema);

const item1 = new Item({
    name: "Welcome to your todolist!",
});
const item2 = new Item({
    name: "Hit the + button to add a new item.",
});
const item3 = new Item({
    name: "<-- Hit this to delete an item.",
});

const defaultItems = [item1, item2, item3];

const listSchema = {
    name: String,
    items: [itemSchema]
};

const List = mongoose.model("List",listSchema);


app.get("/",function(req,res){
    // const today = new Date();
    
    // let options = {
    //     weekday: "long",
    //     day: "numeric",
    //     month: "long"
    // }

    // let day = today.toLocaleDateString("en-US",options);

    Item.find({},function(err, foundItems){
        if(foundItems.length === 0){
            Item.insertMany(defaultItems,(err)=>{
                err ? console.log(err) : console.log(("Successfully saved default items to DB."));
            });
        }

        if(err){
            console.log(err);
        }
        else{
            res.render("lists", {listTitle: "Today" , tasks: foundItems});
        }
    });
});

app.get("/:customListName",function(req,res){
    const customListName= _.capitalize(req.params.customListName);

    List.findOne({name: customListName},function(err,foundList){
        if(!err){
            if(!foundList){
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
                list.save();
                res.redirect("/" + customListName);
            }
            else {
                res.render("lists", {listTitle: customListName, tasks: foundList.items});
            }
        }
    });
})

app.get("/about",function(req,res){
    res.render("about");
});

app.post("/",function(req,res){
    const listName = req.body.list;
    const itemName = req.body.newTask;
    // console.log(req.body);

    const newTask = new Item({
        name: itemName,
    });


    if(listName === 'Today'){
        newTask.save();
        res.redirect("/");
    }
    else {
        List.findOne({name: listName}, function(err, foundList){
            foundList.items.push(newTask);
            foundList.save();

            res.redirect("/" + listName);
        })
    }
});

app.post("/delete",function(req,res){
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if(listName === 'Today'){
        Item.deleteOne({_id: checkedItemId},err => {
            err ? console.log(err) : console.log("Succefully item is deleted.");;
        })
        res.redirect("/");
    }
    else {
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}},function(err, foundList){
            // let idx = -1;
            // for(var i=0;i<foundList.length;++i){
            //     if(foundList[i]._id === checkedItemId){
            //         idx = i;
            //     }
            // }
            // foundList.items.splice(idx,1);
            // foundList.save();
            if(!err)
                res.redirect("/" + listName);
        })
    }
});

app.listen(3000, function() {
    console.log("Server is running on port: 3000");
});