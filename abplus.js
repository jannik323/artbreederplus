
let urlsplit = window.location.pathname.split("/");
const USER = urlsplit[urlsplit.length-1];
let select = false;

class Imageobserver {

    constructor(){
        this.size=0;
        this.imagecontainer=null;
        this.checkloop;

    }

    startcheck(){
        this.checkloop = setInterval(checkimagechange, 500);
        removeblockedimgs();
        // removeblockednotif();
        addclickEvent();
    }

    stopcheck(){
        clearInterval(this.checkloop);
        removeselector();
    }
    
    check(){
        if(this.imagecontainer.childNodes.length!==this.size){
            this.size=this.imagecontainer.childNodes.length;
            return true;
        }
        return false;
    }
}
let imageobserver = new Imageobserver();
function checkimagechange(){
    if(imageobserver.check()){
        removeblockedimgs();
        // removeblockednotif();
        addclickEvent();
    }
}

if(JSON.parse(localStorage.getItem("darkmode"))){
    enabledarkmode();
}

if(USER=="test"){
    speeeen();
}

setTimeout(()=>{start(true)},500);


function addclickEvent(){
    let imageContainer = imageobserver.imagecontainer;
    let images = imageContainer.childNodes;
    for (let i = 0; i < images.length; i++) {
        if(!images[i].getAttribute("abplus-clickcheck")){
            images[i].setAttribute("abplus-clickcheck",true);
            images[i].addEventListener("click",e=>{
                if(e.altKey){
                    images[i].classList.toggle("selected");
                    
                }
            })
        }
    }
}
    
function removeblockedimgs(){
    let savedblock = JSON.parse(localStorage.getItem("abplus-blocked"));
    if(savedblock.includes(USER)){
        console.log("stopped blocking images by "+USER+ " temporary. User is on their profile page.");
        return;
    }
    let imageContainer = imageobserver.imagecontainer;
    let images = imageContainer.childNodes;
    let deletecount=0;
    for (let i = 0; i < images.length; i++) {
        if(images[i].lastChild==null){
            continue;
        }
        let imgowner = images[i].lastChild.lastChild.firstChild.firstChild.innerText;
        if(savedblock.includes(imgowner)){
            images[i].remove();
            deletecount++;
        }
    }
    console.log("blocked "+ deletecount+ " images");
    let blocks = JSON.parse(localStorage.getItem("abplus-blockedimgs"));
    if(blocks!=null){deletecount+=blocks}
    localStorage.setItem("abplus-blockedimgs",JSON.stringify(deletecount));
}

// function removeblockednotif(){
//     let savedblock = JSON.parse(localStorage.getItem("abplus-blocked"));
//     let notcon = document.getElementById("notification_container");
//     if(!notcon){return}
//     let notis = notcon.childNodes;
//     for (let i = 0; i < notis.length; i++) {
//         if(notis[i].lastChild==null){
//             continue;
//         }
//         console.log(notis[i].classList);
       
//     }
// }

function addextras() {

    //defaulting localstorage
    if(localStorage.getItem("abplus-blocked")==null){
        let blocks = []
        localStorage.setItem("abplus-blocked",JSON.stringify(blocks));
    }


    {let speen = document.createElement("button");speen.style.transform="scale(0.1)";speen.style.opacity=0.5; speen.addEventListener("click",()=>{speeeen()});document.body.appendChild(speen);}

    //burger menu btn
    let dropdown = document.querySelector("div.dropdown-content");
    if(dropdown==null){
        dropdown = document.querySelector("div.header-right");
        if(dropdown==null)return;
    };
    let btn = document.createElement("a");
    btn.innerText = "AB+ Settings";
    btn.href = "/artbreederplus";
    
    dropdown.insertBefore(btn,dropdown.childNodes[0]);
    //

    // logo + thingy
    let logos = document.querySelectorAll(".header a.logo");
    logos.forEach(logo => {
        let plus = document.createElement("span");
        plus.innerText = " +";
        logo.appendChild(plus);
    });
    //

    let style = document.querySelector("style"),sheet,images,imagescontainer;
    sheet = style.sheet;
    sheet.insertRule(".header a.logo span{transition:color .5s }", sheet.cssRules.length);
    sheet.insertRule(".header a.logo span:hover{color:white }", sheet.cssRules.length);
    //remove weird scrollbars
    sheet.insertRule(".profile_nav,.buttons_container{overflow:auto !important}", sheet.cssRules.length);    
    //selector shit
    sheet.insertRule("#abplus-masstag-input{border: none; background: transparent;text-align: center;width: 100px;}", sheet.cssRules.length);    
    sheet.insertRule("#abplus-masstag-input:focus-visible{outline: none;}", sheet.cssRules.length);    
    //block btn 
    sheet.insertRule("#block_button{margin-left:1rem; background:red;}", sheet.cssRules.length);    
    sheet.insertRule(".card{width: 500px;background-color: white;box-shadow: 0 4px 4px 0 rgba(0, 0, 0, 0.1);border-radius: 5px;padding: 20px;}", sheet.cssRules.length);   
    sheet.insertRule(".row_element{display: inline-block;max-width: 450px;}", sheet.cssRules.length);   
    //blockeduserlist
    sheet.insertRule(".blockeduser{display:flex;align-items:center;list-style-type: none; background: rgba(67, 64, 64, 0.58); margin: 1rem;}", sheet.cssRules.length);   
    sheet.insertRule(".blockeduser button{margin-left: auto;}", sheet.cssRules.length);   
    sheet.insertRule(".blockeduser span{margin-left:1rem;}", sheet.cssRules.length);   
    sheet.insertRule(".blockeduser span:hover{cursor:pointer}", sheet.cssRules.length);   
    // X something
    sheet.insertRule(".Xsomething::after{content: url(/svg/x_s1.svg);width: 100%;height: 100%;scale: 2.5;justify-content: center;align-items: center;display: flex;}", sheet.cssRules.length);   



    if(USER=="artbreederplus"){
        let abplustitle = document.querySelector(".row.title_row h1");
        if(abplustitle!=null){
            abplustitle.innerText ="Artbreeder+ Settings";
        }


        //first card
        let div = document.createElement("div");
        div.classList.add("row");
        div.classList.add("title_row");
        let card = document.createElement("div");
        card.classList.add("row_element");
        card.classList.add("card");
        div.appendChild(card);
        
        //change color
        let input = document.createElement("input");
        input.type="color";
        input.value="#222222";
        if(JSON.parse(localStorage.getItem("darkmode-color"))){
            input.value = JSON.parse(localStorage.getItem("darkmode-color"))
        }
        input.addEventListener("change",e=>{
            localStorage.setItem("darkmode-color",JSON.stringify(e.target.value));
            let element = document.getElementById("darkmodestylesheet");
            let sheet = element.sheet;
            sheet.cssRules[3].style.background = e.target.value;
            sheet.cssRules[5].style.background = shadeColor(e.target.value,-70);
            let isokay = confirm("Do you want to overwrite the website link on your profile page in order to share your color theme with other visitors ?");
            if(isokay){addcolorsafe(e.target.value);}
        })

        let text = document.createElement("span");
        text.innerText="custom darkmode color: ";
        let title = document.createElement("h3");
        title.innerText ="Darkmode Settings";
        title.style.marginTop ="0px";
        let reset = document.createElement("button");
        reset.classList.add("primary_button");
        reset.innerText = "Reset";
        reset.addEventListener("click",()=>{
            let color = "#222222"
            input.value=color;
            localStorage.setItem("darkmode-color",JSON.stringify(color));
            let element = document.getElementById("darkmodestylesheet");
            let sheet = element.sheet;
            sheet.cssRules[3].style.background = color;
            sheet.cssRules[5].style.background = shadeColor(color,-70);
            let isokay = confirm("Do you want to overwrite the website link on your profile page in order to share your color theme with other visitors ?");
            if(isokay){addcolorsafe(color);}
        })

        //toggle darkmode

        let ison = JSON.parse(localStorage.getItem("darkmode"));
        if(ison==null){
            ison=false;
            localStorage.setItem("darkmode",JSON.stringify(ison));
        }
        let check = document.createElement("input");
        check.style.cursor="pointer";
        check.type = "checkbox";
        check.id = "darkmode-check-menu";
        check.checked = ison;
        check.addEventListener("change",(e)=>{
            localStorage.setItem("darkmode",JSON.stringify(e.target.checked));
            ison=e.target.checked;
            if(ison){
                enabledarkmode();
            }else{
                disabledarkmode();
            }
        });
        let label = document.createElement("label");
        label.innerText = "Darkmode";
        label.setAttribute("for","darkmode-check-menu");
        

        card.appendChild(title);
        card.appendChild(document.createElement("hr"));
        
        card.appendChild(label);
        card.appendChild(check);
        card.appendChild(document.createElement("br"));
        card.appendChild(document.createElement("br"));

        card.appendChild(text);
        card.appendChild(input);
        

        card.appendChild(document.createElement("br"));
        card.appendChild(document.createElement("br"));
        
        card.appendChild(document.createElement("hr"));
        card.appendChild(document.createElement("br"));
        card.appendChild(reset);

        document.body.insertBefore(div,document.body.childNodes[5]);
        document.body.insertBefore(document.createElement("br"),document.body.childNodes[6]);

        // 2nd card

        div = document.createElement("div");
        div.classList.add("row");
        div.classList.add("title_row");
        card = document.createElement("div");
        card.classList.add("row_element");
        card.classList.add("card");
        div.appendChild(card);

        title = document.createElement("h3");
        title.innerText ="Block Settings";
        title.style.marginTop ="0px";
        
        let blockedusertitle = document.createElement("h4");
        blockedusertitle.innerText = "Blocked Users";

        let list = document.createElement("ul");
        list.style.height =" 200px";
        list.style.overflowY = "auto";
        let blocked = JSON.parse(localStorage.getItem("abplus-blocked"));
        blocked.forEach(block => {
            addblockelement(block, list);
        });

        let blockdiv = document.createElement("div");
        blockdiv.style.display = "flex";
        blockdiv.style.justifyContent = "center";
        blockdiv.style.alignItems = "center";
        let blockfield = document.createElement("input");
        blockfield.type = "text";
        blockfield.placeholder = "user name";
        let blockbtn = document.createElement("button");
        blockbtn.innerText = "Block User";
        blockbtn.classList.add("primary_button");
        blockbtn.addEventListener("click",()=>{
            if(!blockfield.value){
                alert("please enter a valid user name !");
                return;
            }
            let blocked = [];
            let savedblock = JSON.parse(localStorage.getItem("abplus-blocked"));
            if(savedblock!=null){blocked=savedblock}
            if(blocked.includes(blockfield.value)){
                alert("user is already blocked!");
                return;
            }
            blocked.push(blockfield.value);
            localStorage.setItem("abplus-blocked",JSON.stringify(blocked));
            addblockelement(blockfield.value,list);
            blockfield.value="";
        })
        blockdiv.appendChild(blockfield);
        blockdiv.appendChild(blockbtn);


        card.appendChild(title);
        card.appendChild(document.createElement("hr"));
        card.appendChild(blockedusertitle);
        card.appendChild(list);
        card.appendChild(document.createElement("hr"));
        card.appendChild(document.createElement("br"));
        card.appendChild(blockdiv);

        document.body.insertBefore(div,document.body.childNodes[7]);
        document.body.insertBefore(document.createElement("br"),document.body.childNodes[8]);
        
        // 3rd card

        div = document.createElement("div");
        div.classList.add("row");
        div.classList.add("title_row");
        card = document.createElement("div");
        card.classList.add("row_element");
        card.classList.add("card");
        div.appendChild(card);

        title = document.createElement("h3");
        title.innerText ="Stats";
        title.style.marginTop ="0px";

        let blockam = document.createElement("span");
        blockam.innerText = "AB+ has blocked "+JSON.parse(localStorage.getItem("abplus-blockedimgs"))+ " images.";

        let resetbtn = document.createElement("button");
        resetbtn.innerText = "Reset";
        resetbtn.classList.add("primary-button");
        resetbtn.addEventListener("click",()=>{
            localStorage.removeItem("abplus-blockedimgs");
            blockam.innerText = "AB+ has blocked 0 images.";
        })



        card.appendChild(title);
        card.appendChild(document.createElement("hr"));
        card.appendChild(blockam);
        card.appendChild(document.createElement("hr"));
        card.appendChild(document.createElement("br"));
        card.appendChild(resetbtn);

        document.body.insertBefore(div,document.body.childNodes[9]);

    }

    function addblockelement(block, list) {
        let blockeduser = document.createElement("li");
        blockeduser.classList.add("blockeduser");
        let blockname = document.createElement("span");
        blockname.innerText = block;
        blockname.addEventListener("click",()=>{
            window.open("/"+blockname.innerText); 
        })
        let removebtn = document.createElement("button");
        removebtn.innerText = "X";
        removebtn.addEventListener("click", () => {
            let savedblock = JSON.parse(localStorage.getItem("abplus-blocked"));
            let userindex = savedblock.findIndex(user=>blockname.innerText===user);
            if(userindex!=-1){
                savedblock.splice(userindex,1);
            }
            localStorage.setItem("abplus-blocked",JSON.stringify(savedblock));
            blockeduser.remove();
        });
        blockeduser.appendChild(blockname);
        blockeduser.appendChild(removebtn);
        list.appendChild(blockeduser);
    }

    //block button stuff
    let profilediv = document.querySelector("div.top_row div.profile div.buttons_container");
    if(profilediv!=null){
        let blockbtn = document.createElement("button");
        let savedblock = JSON.parse(localStorage.getItem("abplus-blocked"));
        if(savedblock.includes(USER)){
            blockbtn.innerText="unblock";
        }else{
            blockbtn.innerText="block";
        }

        blockbtn.id = "block_button";
        blockbtn.addEventListener("click",()=>{
            let blocked = [];
            let savedblock = JSON.parse(localStorage.getItem("abplus-blocked"));
            if(savedblock!=null){
                blocked = savedblock;
            }
            let userindex = blocked.findIndex((user)=>{
                return USER === user;
            });
            if(userindex!=-1){
                blocked.splice(userindex,1);
                blockbtn.innerText="block";
            }else{
                blocked.push(USER);
                blockbtn.innerText="unblock";
            }
            localStorage.setItem("abplus-blocked",JSON.stringify(blocked));
        });

        profilediv.appendChild(blockbtn);
    }
    //

    //set color to theme if there is one
    let colorlink = document.querySelector("div.link.website");
    if(colorlink!=null){
        let element = document.getElementById("darkmodestylesheet");
        if(element!=null){
            let link = colorlink.getAttribute("data-url");
            let linksplit = link.split("/");
            let color = linksplit[linksplit.length-1];
            if(color[0]== "#"){
                colorlink.style.opacity ="0.5";
                let sheet = element.sheet;
                sheet.cssRules[3].style.background = color;
                sheet.cssRules[5].style.background = shadeColor(color,-70);
            }else{
                console.log("not a ab+ user / not a ab+ color link")
            }
        }
    }

    //get image container if there is one
    if(USER=="browse"||USER=="i"){
        imagescontainer = document.querySelector("div.children_container");
    }else{
        imagescontainer = document.querySelector("div#images div.children_container");
    }
    images = imagescontainer.childNodes; 
   
    if(images==null){
        console.error("image container not found!");
        return;
    } 

    imageobserver.imagecontainer = imagescontainer;
    imageobserver.startcheck();
    
    //selector stuff
    let selectordiv = document.getElementById("image-group-selector");
    let tagbtn = document.createElement("div");
    let input = document.createElement("input");
    input.type="text";

    //tag btn
    input.placeholder = "tag name";
    input.id ="abplus-masstag-input";
    tagbtn.classList.add("image_opt");
    tagbtn.classList.add("tag-button");
    tagbtn.addEventListener("click",e=>{addtags(input.value,e.shiftKey)})
    selectordiv.appendChild(tagbtn);
    selectordiv.appendChild(input);

    //delete btn

    let deletebtn = document.createElement("div");
    deletebtn.classList.add("image_opt");
    deletebtn.classList.add("delete");
    deletebtn.addEventListener("click",()=>{deleteimages()})
    selectordiv.appendChild(deletebtn);

    // private btn 

    let privatebtn = document.createElement("div");
    privatebtn.classList.add("image_opt");
    privatebtn.classList.add("privacy");
    privatebtn.addEventListener("click",(e)=>{privateimages(!e.shiftKey)})

    addEventListener("keydown",(e)=>{if (e.code === "ShiftLeft"){privatebtn.classList.add("private"); tagbtn.classList.add("Xsomething");}})
    addEventListener("keyup",(e)=>{if (e.code === "ShiftLeft"){privatebtn.classList.remove("private"); tagbtn.classList.remove("Xsomething"); }})


    selectordiv.appendChild(privatebtn);

    let clearbutn =document.getElementById("clear");
    clearbutn.addEventListener("click",()=>{
        let imageContainer = imageobserver.imagecontainer;
        let images = imageContainer.childNodes;
        for (let i = 0; i < images.length; i++) {
            images[i].classList.remove("selected");
        }
    })

    
    //

}

function addcolorsafe(color){
    let PARA = {
        headers:{
            "Host": "www.artbreeder.com",
            "Accept": "application/json",
            "Accept-Encoding": "gzip, deflate, br",
            "Referer": "https://www.artbreeder.com/"+USER,
            "Content-Type": "application/json",
            "Origin": "https://www.artbreeder.com",
            "Content-Length": "124",
        },
        body:JSON.stringify({
            website:"https://www.artbreeder.com/"+color,
            }),
        method:"POST"
    };
    
    fetch("https://www.artbreeder.com/set_userdata",PARA)
    .then(response => {
    if (!response.ok) {
        throw new Error("HTTP error " + response.status);
    }
    }).catch(err=>{console.error(err)});
}

function addtags(tag,remove=false){
    if(!tag){alert("please enter a valid tag name"); return;}
    let selected = getselected();
    let isokay
    if(remove){
        isokay = confirm("Do you want to remove the tag "+ tag +" from " +selected.length+" images?");
    }else{
        isokay = confirm("Do you want to add the tag "+ tag +" to " +selected.length+" images?");
    }
    if(!isokay)return;
    selected.forEach(key => {
        changetag(key,tag,remove);
    });
}
function deleteimages(){
    let selected = getselected();
    let isokay = confirm("Do you want to delete "+selected.length+" images? You can't revert this !");
    if(!isokay)return;
    selected.forEach(key => {
        deleteimage(key);
    });
}
function privateimages(private=true){
    let selected = getselected();
    let isokay;
    if(private){
        isokay = confirm("Do you want to private "+selected.length+" images?");
    }else{
        isokay = confirm("Do you want to make "+selected.length+" images public?");
    }
    if(!isokay)return;
    selected.forEach(key => {
        privateimage(key,private);
    });
}

function changetag(key="507880370586758c859d2a199847",tag="test",remove=false){
    let PARA;
    let URL = "https://www.artbreeder.com/add_tag";
    if(remove){
        URL = "https://www.artbreeder.com/remove_tag";
    }
    PARA = {
        headers:{
            "Host": "www.artbreeder.com",
            "Accept": "application/json",
            "Accept-Encoding": "gzip, deflate, br",
            "Referer": "https://www.artbreeder.com/browse",
            "Content-Type": "application/json",
            "Origin": "https://www.artbreeder.com",
            "Content-Length": "124",
        },
        body:JSON.stringify({
            imagekey:key,
            tagname:tag,
            }),
        method:"POST"
    };
    
    fetch(URL,PARA)
    .then(response => {
    if (!response.ok) {
        throw new Error("HTTP error " + response.status);
    }
    }).catch(err=>{console.error(err)});
}
function deleteimage(key="0"){
    let PARA;
    PARA = {
        headers:{
            "Host": "www.artbreeder.com",
            "Accept": "application/json",
            "Accept-Encoding": "gzip, deflate, br",
            "Referer": "https://www.artbreeder.com/"+USER,
            "Content-Type": "application/json",
            "Origin": "https://www.artbreeder.com",
            "Content-Length": "124",
        },
        body:JSON.stringify({
            key:key,
            }),
        method:"POST"
    };
    
    fetch("https://www.artbreeder.com/delete_image",PARA)
    .then(response => {
    if (!response.ok) {
        throw new Error("HTTP error " + response.status);
    }
    }).catch(err=>{console.error(err)});
}
function privateimage(key="0",privacy=true){
    let PARA;
    PARA = {
        headers:{
            "Host": "www.artbreeder.com",
            "Accept": "application/json",
            "Accept-Encoding": "gzip, deflate, br",
            "Referer": "https://www.artbreeder.com/"+USER,
            "Content-Type": "application/json",
            "Origin": "https://www.artbreeder.com",
            "Content-Length": "124",
        },
        body:JSON.stringify({
            key:key,
            private:privacy,
            }),
        method:"POST"
    };
    
    fetch("https://www.artbreeder.com/change_privacy",PARA)
    .then(response => {
    if (!response.ok) {
        throw new Error("HTTP error " + response.status);
    }
    }).catch(err=>{console.error(err)});
}

function getselected() {
    let selected = [];
    let imageContainer = imageobserver.imagecontainer;
    let images = imageContainer.childNodes;
    for (let i = 0; i < images.length; i++) {
        if (images[i].classList.contains("selected")) {
            selected.push(images[i].getAttribute("data-key"));
        }
    }
    return selected;
}

function speeeen(){
    let test = document.querySelectorAll("*");
    test.forEach(e => {
        e.style.transform = "rotate(" + 360 * (((Math.random() - .5))*10) + "deg)";
        e.style.transition = "transform 420s";
    });
}

function enabledarkmode(){
    let color = "#222222";
    if(JSON.parse(localStorage.getItem("darkmode-color"))){
        color = JSON.parse(localStorage.getItem("darkmode-color"))
    }else{
        localStorage.setItem("darkmode-color",JSON.stringify(color));
    }
    let element = document.createElement('style'),sheet;
    element.id = "darkmodestylesheet";
    document.head.appendChild(element);
    sheet = element.sheet;
    sheet.insertRule(".dropdown-content a,*,a,.header_option{color:#898989;}", sheet.cssRules.length);
    sheet.insertRule(".recent-tag,#image-tag-popup,.social,.notification,body,.modal-content{background:"+color+";}", sheet.cssRules.length);
    sheet.insertRule(".image-tag,select,#preview,input,.button-group .option{background:#333;}", sheet.cssRules.length);
    sheet.insertRule("#image-group-selector,.model, .method,.button-group .option.selected,.card,.text-imagecontainer-inner,.dropdown-content,.taginfo,.usergene-info,.gene_controller,.user-pill,.header{background:"+shadeColor(color,-70)+";}", sheet.cssRules.length);
    sheet.insertRule(".gene_controller img{background:#999; border-radius:5px}", sheet.cssRules.length);
    sheet.insertRule(".user-links .link img{filter: drop-shadow(0px 0px 1px rgba(255, 255, 255, 1.0)) drop-shadow(0px 0px 4px rgba(255, 255, 255, 0.75));}")
    sheet.insertRule("#image-tag-popup input[type='text']{background:black !important;}")
}

function shadeColor(color, percent) {
    // https://stackoverflow.com/a/13532993
    var R = parseInt(color.substring(1,3),16);
    var G = parseInt(color.substring(3,5),16);
    var B = parseInt(color.substring(5,7),16);
    R = parseInt(R * (100 + percent) / 100);
    G = parseInt(G * (100 + percent) / 100);
    B = parseInt(B * (100 + percent) / 100);
    R = (R<255)?R:255;  
    G = (G<255)?G:255;  
    B = (B<255)?B:255;  
    var RR = ((R.toString(16).length==1)?"0"+R.toString(16):R.toString(16));
    var GG = ((G.toString(16).length==1)?"0"+G.toString(16):G.toString(16));
    var BB = ((B.toString(16).length==1)?"0"+B.toString(16):B.toString(16));
    return "#"+RR+GG+BB;
}

function disabledarkmode(){
    let darkmodes = document.querySelectorAll("#darkmodestylesheet")
    darkmodes.forEach(e=>{e.remove()});
}

function start(){
    addextras();
    console.log("fetching likes !");
    let URL ="none";
    let PARA;
    if(USER=="browse"){
        URL= "https://www.artbreeder.com/trending";
        PARA = {
            headers:{
                "Host": "www.artbreeder.com",
                "Accept": "application/json",
                "Accept-Encoding": "gzip, deflate, br",
                "Referer": "https://www.artbreeder.com/browse",
                "Content-Type": "application/json",
                "Origin": "https://www.artbreeder.com",
                "Content-Length": "124",
            },
            body:JSON.stringify({
                "order_by":"likes",
                "limit":50,
                "order":"desc",
                "offset":0
            }),
            method:"POST"
        };
    }else if(USER=="i"){
        URL= "https://www.artbreeder.com/image_children";
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        const id = urlParams.get('k');
        PARA = {
            headers:{
                "Host": "www.artbreeder.com",
                "Accept": "application/json",
                "Accept-Encoding": "gzip, deflate, br",
                "Referer": window.location.href+"",
                "Content-Type": "application/json",
                "Origin": "https://www.artbreeder.com",
                "Content-Length": "124",
            },
            body:JSON.stringify({
                "image_key":id,
                "limit":50,
                "offset":0
            }),
            method:"POST"
        };
    }else{
        URL= "https://www.artbreeder.com/images";
        PARA = {
            headers:{
                "Host": "www.artbreeder.com",
                "Accept": "application/json",
                "Accept-Encoding": "gzip, deflate, br",
                "Referer": "https://www.artbreeder.com/"+USER+"",
                "Content-Type": "application/json",
                "Origin": "https://www.artbreeder.com",
                "Content-Length": "124",
            },
            body:JSON.stringify({
                "order_by":"likes",
                "limit":50,
                "creator":USER,
                "starred_by":null,
                "order":"desc",
                "uploaded":false,
                "models":"all",
                "offset":0
            }),
            method:"POST"
        };
    }
    if(URL==="none"){
        console.log("cant fetch likes for this page.")
        return;
    }
    fetch(URL,PARA)
    .then(response => {
    if (!response.ok) {
        throw new Error("HTTP error " + response.status);
    }
    return response.json();
    })
    .then(data=>{
        console.log("raw like data:");
        console.log(data);
        displayLikes(data);
    })
    .catch(err=>{console.error(err)});

}

function displayLikes(likes){
    let imageContainer = imageobserver.imagecontainer;
    let images = imageContainer.childNodes;
    let imgi = 0;
    for (let i = 0; i < images.length; i++) {
        if(images[i].lastChild==null){
            continue;
        }
        while(images[i].getAttribute("data-key")!=likes[imgi].key){
            imgi++;
        }
        let likeHTML = document.createElement("p");
        likeHTML.classList.add("time_string");
        likeHTML.style = "display: flex;align-items: center; margin-right:5px;" ;
        likeHTML.innerText  = likes[imgi].likes;
        if(likes[imgi].likes===null){
            likeHTML.innerText  = 0;
        }
        images[i].lastChild.firstChild.insertBefore(likeHTML,images[i].lastChild.firstChild.childNodes[0]);
        imgi++;
        
    }
}
