let defaultsettings = {
    displaylikes:true,
    blocknoti:true,
    displayfollows:false,
    displaytopimgs:false,
    darkmode:true,
    darkmodecolor:"#222222",
}
{ // check default 
    let settings =  JSON.parse(localStorage.getItem("abplus-settings"));
    if(!settings){
        console.log("first time?");
        settings = defaultsettings;
        localStorage.setItem("abplus-settings",JSON.stringify(settings));
    }
    if(Object.keys(defaultsettings).length!=Object.keys(settings).length){
        console.log("updated")
        for (let p in defaultsettings) {
            settings[p] = settings[p]??defaultsettings[p]; 
        }
        for (let p in settings) {
            if(defaultsettings[p]==undefined){
                delete settings[p];
            }
        }
        localStorage.setItem("abplus-settings",JSON.stringify(settings));
    }
    // clear old localstorage entries
    let dm = localStorage.getItem("darkmode");
    if(dm){
        console.log("old localStorage data detected ! Transferring to new one")
        absettings("darkmode",true,JSON.parse(dm));
        localStorage.removeItem("darkmode");
    }
    let dmc = localStorage.getItem("darkmode-color");
    if(dmc){
        console.log("old localStorage data detected ! Transferring to new one")
        absettings("darkmodecolor",true,JSON.parse(dmc));
        localStorage.removeItem("darkmode-color");
    }
}

// abp style stuff
customstyle();

if(absettings("darkmode")){
    enabledarkmode();
}

let USER;
{
let urlsplit = window.location.pathname.split("/");
USER = urlsplit[urlsplit.length-1];
}

let Imo= {

    size:0,
    imagecontainer:null,
    checkloop:null,
    likechecksize:0,
    likecheckoffset:0,
    displaylikes:absettings("displaylikes"),

    startcheck(){
        setTimeout(() => {Imo.checkloop = setInterval(Imo.checkimagechange, 100)}, 200);
        removeblockedimgs();
        addclickEvent();
    },

    stopcheck(){
        clearInterval(Imo.checkloop);
    },

    checkimagechange(){
        if(Imo.imagecontainer.childNodes.length!==Imo.size){
            if(Imo.imagecontainer.childNodes.length<Imo.size||Imo.size<40){
                Imo.likechecksize=Imo.imagecontainer.childNodes.length;
                Imo.likecheckoffset=0;
            }else{
                Imo.likechecksize=Imo.imagecontainer.childNodes.length-Imo.size;
                Imo.likecheckoffset=Imo.imagecontainer.childNodes.length-Imo.likechecksize-2;
                if(Imo.size==0){Imo.likecheckoffset=0}
            }
            Imo.size=Imo.imagecontainer.childNodes.length;
            removeblockedimgs();
            addclickEvent();
            if(Imo.displaylikes){
                getlikes();
            }
        }
    }
}

let Noo= {

    size:0,
    noticontainer:null,
    checkloop:null,

    startcheck(){
        setTimeout(() => {Noo.checkloop = setInterval(Noo.checkimagechange, 100)}, 200);
    },

    stopcheck(){
        clearInterval(Noo.checkloop);
    },

    checkimagechange(){
        if(Noo.noticontainer.childNodes.length!==Noo.size){
            Noo.size=Noo.noticontainer.childNodes.length;
            removeblockednotif();
        }
    }
}

const reqheader = {
    "Accept": "application/json",
    "Content-Type": "application/json",
};
start();

function addclickEvent(){
    let imageContainer = Imo.imagecontainer;
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
    let imageContainer = Imo.imagecontainer;
    let images = imageContainer.childNodes;
    let deletecount=0;
    for (let i = 0; i < images.length; i++) {
        if(images[i].lastChild==null){
            continue;
        }
        let imgowner = images[i].querySelector("a.creator_name").innerText;
        if(savedblock.includes(imgowner)){
            images[i].style.display =" none";
            deletecount++;
        }
    }
    let blocks = JSON.parse(localStorage.getItem("abplus-blockedimgs"));
    if(blocks!=null){deletecount+=blocks}
    localStorage.setItem("abplus-blockedimgs",JSON.stringify(deletecount));
}

function removeblockednotif(){
    let savedblock = JSON.parse(localStorage.getItem("abplus-blocked"));
    let notcon = document.getElementById("notification_container");
    if(!notcon){return}
    let notis = notcon.childNodes;
    let deletecount=0;
    for (let i = 0; i < notis.length; i++) {
        if(!notis[i].classList.contains("notification"))continue;
        let imgowner = notis[i].querySelector("p a").innerText;
        if(savedblock.includes(imgowner)){
            notis[i].style.display="none";
            deletecount++;
        }
    }
    let blocks = JSON.parse(localStorage.getItem("abplus-blockedimgs"));
    if(blocks!=null){deletecount+=blocks}
    localStorage.setItem("abplus-blockedimgs",JSON.stringify(deletecount));
}

function absettings(attribute="all",set=false,value=false){
    let settings =  JSON.parse(localStorage.getItem("abplus-settings"));
    if(set){
        settings[attribute] = value;
        localStorage.setItem("abplus-settings",JSON.stringify(settings));
    }else{
        if(attribute==="all"){
            return settings;
        }
        return settings[attribute];
    }
}

function getTopImg(count=10,options={},offset=0,topdata=[]){
    if(count<=0){
        console.log(topdata);
        displaytopimgs(topdata,document.getElementById("imgholderabp"));
        return;
    }

    let PARA={
        headers:reqheader,
        body:{
            "order_by":"likes",
            "tags":options.tags,
            "tag_search_type":options.searchmode,
            "models":options.model,
            "offset":offset,
            "limit":1,
            "starred_by":"any"
        },
        method:"POST"
    };
    PARA.body=JSON.stringify(PARA.body);
    fetch("https://www.artbreeder.com/images",PARA)
    .then(response => {
        if (!response.ok) {
            displaytopimgs(topdata,document.getElementById("imgholderabp"));
            alert("an error has occured while requesting the top images. All data found will be displayed.")
            throw new Error("HTTP error " + response.status);
        }
        return response.json();
    })
    .then(data=>{
        let progres = document.getElementById("abpprogrestoppic");
        progres.value = Number(progres.max)-count;
        let topimg = data[0];
        topdata.push(topimg);
        let newoffset = topimg.likes+offset;
        console.log("offset of : "+ newoffset+ " with index "+ count);
        setTimeout(()=>{getTopImg(count-1,options,newoffset,topdata);},200);
    })
    .catch(err=>{console.error(err)});
}

function displaytopimgs(data,container){
    while (container.hasChildNodes()) {  
        container.removeChild(container.firstChild);
    }
    if(!document.getElementById("abptopmodal").classList.contains("open")){
        if(confirm("The Top Images have loaded ! Do you want to open the Top Images Window?")){
            document.getElementById("abptopmodal").classList.add("open");
            document.body.classList.add("modal-open");
        }
    }
    for (let i = 0; i < data.length; i++) {
        let div = document.createElement("div");
        div.classList.add("image-card");

        let img = document.createElement("img");
        img.classList.add("imglink");
        img.src = "https://artbreeder.b-cdn.net/imgs/"+ data[i].key+".jpeg";
        img.classList.add("hoverpointer");
        img.onclick=()=>{
            window.open("/i?k="+data[i].key);
        }
        div.appendChild(img);

        let cardbtm = document.createElement("div");
        cardbtm.classList.add("card-bottom");
        div.appendChild(cardbtm);

        let idkwhat = document.createElement("div");
        idkwhat.classList.add("abpbtm");
        cardbtm.appendChild(idkwhat);

        let place = document.createElement("span");
        place.classList.add("placeab");
        switch(i){
            case 0:
                place.innerText =(i+1)+"st place";
                place.style.color="gold";
                break;
            case 1:
                place.innerText =(i+1)+"nd place";
                place.style.color="silver";
                break;
            case 2:
                place.innerText =(i+1)+"rd place";
                place.style.color="brown"; //💩
                break;
            default:
                place.innerText =(i+1)+"th place";
                break;
        }
        idkwhat.appendChild(place);

        let likes = document.createElement("span");
        likes.classList.add("time_string");
        likes.innerText = data[i].likes+ " likes";
        idkwhat.appendChild(likes);


        let creator = document.createElement("span");
        creator.classList.add("time_string");
        creator.classList.add("hoverpointer");
        creator.innerText = data[i].creator_name;
        creator.onclick=()=>{
            window.open("/"+creator.innerText);
        }
        idkwhat.appendChild(creator);

        container.appendChild(div);
    }
    document.getElementById("abpreqbtn").classList.remove("disabled");
}

function getallfollowers(container){
    if(container!=null){
        let am = container.children.length;
        let i = 0;
        let getem = setInterval(() => {
            getfollower(container,i);
            i++;
            if(i>=am){
                clearInterval(getem);
            }
        }, 400);
    }
}

function getfollower(followertab,i){
    const element = followertab.children[i];
    let num = document.createElement("p");
    fetch(element.href)
    .then(response => {
        return response.text()
    }).then(html => {
        let parser = new DOMParser();
        let doc = parser.parseFromString(html, "text/html");
        num.innerText=doc.querySelector("#followers").children.length;
    element.appendChild(num);
    }).catch(err=>{console.error(err)});
}

function start() {

    // abp reload test
    if(document.body.getAttribute("abplus")){
        if(confirm("AB+ has been reloaded. You might have to reload the page to make changes effective !")){
            location.reload();
        }
        return;
    }
    document.body.setAttribute("abplus",true);

    //defaulting localstorage
    if(localStorage.getItem("abplus-blocked")==null){
        let blocks = []
        localStorage.setItem("abplus-blocked",JSON.stringify(blocks));
    }

    // topimgs thing
    if(absettings("displaytopimgs")){

        let contenttype = document.querySelector(".content-type");
        if(contenttype!==null){
            let topimg = document.createElement("h3");
            topimg.innerText = "Top Images";
            topimg.addEventListener("click",()=>{
                document.getElementById("abptopmodal").classList.toggle("open");
                document.body.classList.add("modal-open");
            });
            topimg.classList.add("tab")
            topimg.classList.add("text_button");
            topimg.id= "topimgbtn";
            contenttype.appendChild(topimg);
        }

        if(USER==="browse"){

            let modal = document.createElement("div");
            modal.classList.add("modal");
            modal.id="abptopmodal";


            let modalcontent = document.createElement("div");
            modalcontent.classList.add("modal-content");
            modal.appendChild(modalcontent);


            let modalhead = document.createElement("div");
            modalhead.classList.add("modal-header");
            modalhead.classList.add("center");
            modalcontent.appendChild(modalhead);

            modalhead.appendChild(document.createElement("br"));
            let titlenum = document.createElement("span");
            titlenum.innerText="Top 5"; 
            titlenum.classList.add("abpheader");
            modalhead.appendChild(titlenum);

            
            let titleimg = document.createElement("span");
            titleimg.innerText=" images "; 
            titleimg.classList.add("abpheader");
            modalhead.appendChild(titleimg);
            modalhead.appendChild(document.createElement("br"));
            modalhead.appendChild(document.createElement("br"));


            let modeloptions = document.querySelector(".model_options").cloneNode(true);
            if(modeloptions!=null){
                modeloptions.classList.remove("model_options");
                modeloptions.id="abpmodeloptions";
                modalhead.appendChild(modeloptions);
    
                for (let i = 0; i < modeloptions.children.length; i++) {
                    modeloptions.children[i].onclick=()=>{
                        let all = true;
                        for (let j = 0; j < modeloptions.children.length; j++) {
                            if(i===j){
                                modeloptions.children[i].classList.remove("inactive");
                            }else{
                                if(!modeloptions.children[j].classList.contains("inactive")){
                                    modeloptions.children[j].classList.add("inactive");
                                    all=false;
                                }
                            }
                        }
                        if(all){
                            for (let j = 0; j < modeloptions.children.length; j++) {
                                modeloptions.children[j].classList.remove("inactive");
                            }
                            titleimg.innerText =" Images";
                        }else{
                            titleimg.innerText =" "+modeloptions.children[i].getAttribute("data-name")+" Images";
                        }
                    }
                }
            }else{
                console.error("modeloptions not found");
            }


            // as of now it takes a bit of a toll on the server so ive removed it for now

            // let searchdiv = document.querySelector("#search_container").cloneNode(true);
            // if(searchdiv!=null){
            //     searchdiv.id="abptopsearch";
            //     searchdiv.classList.remove("hidden");
            //     modalhead.appendChild(searchdiv);
            //     let btns = searchdiv.querySelector(".button-group");
            //     for (let i = 0; i < btns.children.length; i++) {
            //         btns.children[i].onclick=(e)=>{
            //             for (let i = 0; i < btns.children.length; i++) {
            //                 btns.children[i].classList.remove("selected");
            //             }
            //             btns.children[i].classList.add("selected");
            //         }
            //     }
            // }else{
            //     console.error("searchdiv not found");
            // }

            
            let places = document.createElement("input");
            places.type="number";
            places.min = 3;
            places.max = 50;
            places.value = 5;
            places.placeholder="Places";
            places.oninput=()=>{
                if(places.value<3){
                    places.value=3;
                }
                if(places.value>50){
                    places.value=50;
                }
                titlenum.innerText="Top "+places.value; 
            }
            modalhead.appendChild(places);
            
            let reqbtn = document.createElement("button");
            reqbtn.innerText="Request Top Images";
            reqbtn.id="abpreqbtn";
            reqbtn.onclick=()=>{
                if(reqbtn.classList.contains("disabled"))return;

                let model = "all";
                let am = 0;
                for (let i = 0; i < modeloptions.children.length; i++) {
                    if(modeloptions.children[i].classList.contains("inactive")){continue}
                    model = [modeloptions.children[i].getAttribute("data-name")];
                    am += 1;
                }
                if(am>1){
                    model = "all";
                }

                let searchmode = "substring";
                // let btns = searchdiv.querySelector(".button-group");
                // for (let i = 0; i < btns.children.length; i++) {
                //     if(btns.children[i].classList.contains("selected")){
                //         searchmode=btns.children[i].getAttribute("data-name");
                //     }
                // }

                let tags = [];
                // let searchinput = searchdiv.querySelector(".search");
                // tags = [searchinput.value];


                getTopImg(places.value,{model:model,searchmode:searchmode,tags:tags});
                reqbtn.classList.add("disabled");
                while (imgc.hasChildNodes()) {  
                    imgc.removeChild(imgc.firstChild);
                } 

                let loader = document.createElement("img");
                loader.src="/image/loading_spinner.gif";
                loader.classList.add("image-card");
                imgc.appendChild(loader);
                
                imgc.appendChild(document.createElement("br"));

                let progres = document.createElement("progress");
                progres.classList.add("image-card");
                progres.max = places.value;
                progres.value=0;
                progres.id="abpprogrestoppic";
                imgc.appendChild(progres);
            }
            modalhead.appendChild(reqbtn);
            
            
            let exitbutton = document.createElement("img");
            exitbutton.classList.add("remove");
            // exitbutton.innerText = "X";
            exitbutton.src="/svg/x.svg";
            exitbutton.onclick = ()=>{
                document.body.classList.remove("modal-open");
                modal.classList.remove("open");
            }
            modalhead.appendChild(exitbutton);


            let modalbody = document.createElement("div");
            modalbody.classList.add("modal-body");
            modalcontent.appendChild(modalbody);

            
            let imgc = document.createElement("div");
            imgc.classList.add("images_container");
            imgc.id="imgholderabp";
            modalbody.appendChild(imgc);

            document.body.appendChild(modal);
        }
    }
    
    //burger menu btn
    let dropdown = document.querySelector("div.dropdown-content");
    if(dropdown!=null){
        let btn = document.createElement("a");
        btn.innerText = "AB+ Settings";
        btn.href = "/artbreederplus";
        dropdown.insertBefore(btn,dropdown.childNodes[0]);
    }else{
        dropdown = document.querySelector("div.header-right");
        if(dropdown!=null){
            let btn = document.createElement("a");
            btn.classList.add("header_option");
            btn.innerText = "AB+ Settings";
            btn.href = "/artbreederplus";
            dropdown.insertBefore(btn,dropdown.childNodes[0]);
        };
    };
    
    // logo + thingy
    let logos = document.querySelectorAll(".header a.logo");
    logos.forEach(logo => {
        let plus = document.createElement("span");
        plus.innerText = " +";
        logo.appendChild(plus);
    });
    //

    // ab+ page
    if(USER=="artbreederplus"){
        let abplustitle = document.querySelector(".row.title_row h1");
        if(abplustitle!=null){
            abplustitle.innerText ="Artbreeder+ Settings";
        }
        //first card darkmode
        {
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
            input.value = absettings("darkmodecolor");
            input.addEventListener("change",e=>{
                absettings("darkmodecolor",true,e.target.value);
                let element = document.getElementById("darkmodestylesheet");
                if(element==null)return;
                let sheet = element.sheet;
                sheet.cssRules[1].style.background = e.target.value;
                sheet.cssRules[2].style.background = shadeColor(e.target.value,-70);
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
                absettings("darkmodecolor",true,color);
                let element = document.getElementById("darkmodestylesheet");
                if(element==null)return;
                let sheet = element.sheet;
                sheet.cssRules[1].style.background = color;
                sheet.cssRules[2].style.background = shadeColor(color,-70);
                let isokay = confirm("Do you want to overwrite the website link on your profile page in order to share your color theme with other visitors ?");
                if(isokay){addcolorsafe(color);}
            })

            //toggle darkmode

            let ison = absettings("darkmode");
            let check = document.createElement("input");
            check.type = "checkbox";
            check.id = "darkmode-check-menu";
            check.checked = ison;
            check.addEventListener("change",(e)=>{
                absettings("darkmode",true,e.target.checked);
                ison=e.target.checked;
                if(ison){
                    enabledarkmode();
                }else{
                    disabledarkmode();
                }
            });
            let label = document.createElement("label");
            label.innerText = "Darkmode";
            label.classList.add("hoverpointer");
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
        }
        // 2nd card //blocked users
        {
            let div = document.createElement("div");
            div.classList.add("row");
            div.classList.add("title_row");
            let card = document.createElement("div");
            card.classList.add("row_element");
            card.classList.add("card");
            div.appendChild(card);

            let title = document.createElement("h3");
            title.innerText ="Block Settings";
            title.style.marginTop ="0px";
            card.appendChild(title);
            card.appendChild(document.createElement("hr"));

            let ison = absettings("blocknoti");
            let check = document.createElement("input");
            check.type = "checkbox";
            check.id = "blocknoti-check-menu";
            check.checked = ison;
            check.addEventListener("change",(e)=>{
                absettings("blocknoti",true,e.target.checked);
                ison=e.target.checked;
                if(ison){
                    let notic = document.getElementById("notification_container");
                    if(notic!=null){
                        Noo.noticontainer = notic;
                        Noo.stopcheck();
                        Noo.startcheck();
                    }
                }else{
                    Noo.startcheck();
                }
            });
            let label = document.createElement("label");
            label.innerText = "Block Notifications ";
            label.classList.add("hoverpointer");
            label.setAttribute("for","blocknoti-check-menu");
            card.appendChild(label);
            card.appendChild(check);

            let blocked = JSON.parse(localStorage.getItem("abplus-blocked"));

            
            let blockedusertitle = document.createElement("h4");
            blockedusertitle.innerText = "Blocked Users ("+blocked.length +")";
            blockedusertitle.style.marginBottom="0px";
            blockedusertitle.style.marginTop="2rem";
            blockedusertitle.id="abpblockedtitle";
            card.appendChild(blockedusertitle);


            let list = document.createElement("ul");
            list.style.height =" 200px";
            list.style.overflowY = "auto";
            list.style.border = "1px solid grey";
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
                blockedusertitle.innerText = "Blocked Users ("+list.children.length +")";
                blockfield.value="";
            })
            blockdiv.appendChild(blockfield);
            blockdiv.appendChild(blockbtn);


            let download = document.createElement("img");
            download.classList.add("abpcstmbtn");
            download.src="/svg/download.svg";
            download.onclick=()=>{
                let tocopy = JSON.parse(localStorage.getItem("abplus-blocked"));
                navigator.clipboard.writeText(tocopy);
                alert("The block list : "+tocopy + " , has been copied to your clipboard!");
            }
            blockdiv.appendChild(download);

            let upload = document.createElement("img");
            upload.classList.add("abpcstmbtn");
            upload.src="/svg/upload.svg";
            upload.onclick=()=>{
                let data = (prompt("Please paste your data in:")).split(",");
                localStorage.setItem("abplus-blocked",JSON.stringify(data));
                while (list.hasChildNodes()) {  
                    list.removeChild(list.firstChild);
                }
                data.forEach(block => {
                    addblockelement(block, list);
                });
                blockedusertitle.innerText = "Blocked Users ("+list.children.length +")";

            }
            blockdiv.appendChild(upload);

            let clear = document.createElement("img");
            clear.classList.add("abpcstmbtn");
            clear.src="/svg/trash.svg";
            clear.onclick=()=>{
                let data = [];
                while (list.hasChildNodes()) {  
                    list.removeChild(list.firstChild);
                }
                blockedusertitle.innerText = "Blocked Users ("+list.children.length +")";
                localStorage.setItem("abplus-blocked",JSON.stringify(data));
            }
            blockdiv.appendChild(clear);



            
            card.appendChild(list);
            card.appendChild(document.createElement("hr"));
            card.appendChild(document.createElement("br"));
            card.appendChild(blockdiv);

            document.body.insertBefore(div,document.body.childNodes[7]);
            document.body.insertBefore(document.createElement("br"),document.body.childNodes[8]);
        }
        // 3rd card other settings
        {
            let div = document.createElement("div");
            div.classList.add("row");
            div.classList.add("title_row");
            let card = document.createElement("div");
            card.classList.add("row_element");
            card.classList.add("card");
            div.appendChild(card);

            let title = document.createElement("h3");
            title.innerText ="Other Settings";
            title.style.marginTop ="0px";
            card.appendChild(title);
            card.appendChild(document.createElement("hr"));

            {let ison = absettings("displaytopimgs");
            let check = document.createElement("input");
            check.type = "checkbox";
            check.id = "displaytopimgs-check-menu";
            check.checked = ison;
            check.addEventListener("change",(e)=>{
                absettings("displaytopimgs",true,e.target.checked);
                ison=e.target.checked;
            });
            let label = document.createElement("label");
            label.innerText = "Top Images Tab";
            label.classList.add("hoverpointer");
            label.setAttribute("for","displaytopimgs-check-menu");
            card.appendChild(label);
            card.appendChild(check);
            card.appendChild(document.createElement("br"));}

            {let ison = absettings("displaylikes");
            let check = document.createElement("input");
            check.type = "checkbox";
            check.id = "displaylikes-check-menu";
            check.checked = ison;
            check.addEventListener("change",(e)=>{
                absettings("displaylikes",true,e.target.checked);
                ison=e.target.checked;
            });
            let label = document.createElement("label");
            label.innerText = "Display Likes";
            label.classList.add("hoverpointer");
            label.setAttribute("for","displaylikes-check-menu");
            card.appendChild(label);
            card.appendChild(check);
            card.appendChild(document.createElement("br"));}

            {let ison = absettings("displayfollows");
            let check = document.createElement("input");
            check.type = "checkbox";
            check.id = "displayfollows-check-menu";
            check.checked = ison;
            check.addEventListener("change",(e)=>{
                absettings("displayfollows",true,e.target.checked);
                ison=e.target.checked;
            });
            let label = document.createElement("label");
            label.innerText = "Display Follows";
            label.classList.add("hoverpointer");
            label.setAttribute("for","displayfollows-check-menu");
            card.appendChild(label);
            card.appendChild(check);
            card.appendChild(document.createElement("br"));}


            let hardresetbtn = document.createElement("button");
            hardresetbtn.innerText = "Hard Reset";
            hardresetbtn.style.background ="darkred";
            hardresetbtn.addEventListener("click",()=>{
                if(confirm("Do you really want to reset all settings?")){
                    localStorage.removeItem("abplus-settings");
                    localStorage.removeItem("abplus-blocked");
                    localStorage.removeItem("abplus-blockedimgs");
                    location.reload(true);                
                }
            })
            card.appendChild(hardresetbtn);
            card.appendChild(document.createElement("br"));


            let speenbtn = document.createElement("button");
            speenbtn.innerText = "Speen";
            speenbtn.addEventListener("click",()=>{
                if(confirm("Do you really want to speen?")){
                    speeeen();             
                }
            })
            card.appendChild(speenbtn);
            card.appendChild(document.createElement("br"));
            card.appendChild(document.createElement("hr"));

            let resetbtn = document.createElement("button");
            resetbtn.innerText = "Reset";
            resetbtn.classList.add("primary_button");
            resetbtn.addEventListener("click",()=>{
                absettings("displaytopimgs",true,defaultsettings.displaytopimgs);
                absettings("displaylikes",true,defaultsettings.displaylikes);
                document.getElementById("displaytopimgs-check-menu").checked=defaultsettings.displaytopimgs
                document.getElementById("displaylikes-check-menu").checked=defaultsettings.displaylikes
            })
            card.appendChild(resetbtn);
            
            

            document.body.insertBefore(div,document.body.childNodes[9]);
            document.body.insertBefore(document.createElement("br"),document.body.childNodes[10]);

        }
        // 4th card stats

        {
            let div = document.createElement("div");
            div.classList.add("row");
            div.classList.add("title_row");
            let card = document.createElement("div");
            card.classList.add("row_element");
            card.classList.add("card");
            div.appendChild(card);

            let title = document.createElement("h3");
            title.innerText ="Stats";
            title.style.marginTop ="0px";

            let blockam = document.createElement("span");
            blockam.innerText = "Blocked "+JSON.parse(localStorage.getItem("abplus-blockedimgs"))+ " images / notifications in total.";

            let version = document.createElement("span");
            version.innerText = "Current Version : "+chrome.runtime.getManifest().version;

            let resetbtn = document.createElement("button");
            resetbtn.innerText = "Reset";
            resetbtn.classList.add("primary_button");
            resetbtn.addEventListener("click",()=>{
                localStorage.removeItem("abplus-blockedimgs");
                blockam.innerText = "AB+ has blocked 0 images.";
            })
            card.appendChild(title);
            card.appendChild(document.createElement("hr"));
            card.appendChild(blockam);
            card.appendChild(document.createElement("br"));
            card.appendChild(version);
            card.appendChild(document.createElement("hr"));
            card.appendChild(document.createElement("br"));
            card.appendChild(resetbtn);
            document.body.insertBefore(div,document.body.childNodes[11]);
            document.body.insertBefore(document.createElement("br"),document.body.childNodes[12]);
        }
        // 5th card info

        {
            let div = document.createElement("div");
            div.id="#Info";
            div.classList.add("row");
            div.classList.add("title_row");
            let card = document.createElement("div");
            card.classList.add("row_element");
            card.classList.add("card");
            div.appendChild(card);

            let title = document.createElement("h3");
            title.innerText ="Info";
            title.style.marginTop ="0px";

            let github = document.createElement("a");
            github.innerText = "github page";
            github.href = "https://github.com/jannik323/artbreederplus";

            let firefox = document.createElement("a");
            firefox.innerText = "firefox addon page";
            firefox.href = "https://addons.mozilla.org/en-US/firefox/addon/ab-plus/";

            let discord = document.createElement("a");
            discord.innerText = "Contact Info";
            discord.href = "#Info";
            discord.addEventListener("click",()=>{
                alert("Discord : jannik#7401");
            })

            card.appendChild(title);
            card.appendChild(document.createElement("hr"));
            card.appendChild(github);
            card.appendChild(document.createElement("br"));
            card.appendChild(firefox);
            card.appendChild(document.createElement("br"));
            card.appendChild(discord);
            card.appendChild(document.createElement("br"));
            document.body.insertBefore(div,document.body.childNodes[13]);
            document.body.insertBefore(document.createElement("br"),document.body.childNodes[14]);

        }
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
            document.getElementById("abpblockedtitle").innerText = "Blocked Users ("+list.children.length +")";

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
    let colorlink = document.querySelector("div.user-links div.link.website");
    if(colorlink!=null){
        let element = document.getElementById("darkmodestylesheet");
        if(element!=null){
            let link = colorlink.getAttribute("data-url");
            if(link!=null){
                let linksplit = link.split("/");
                let color = linksplit[linksplit.length-1];
                if(color[0]== "#"){
                    colorlink.style.opacity ="0.5";
                    let sheet = element.sheet;
                    sheet.cssRules[1].style.background = color;
                    sheet.cssRules[2].style.background = shadeColor(color,-70);
                }else{
                    console.log("not a ab+ user / not a ab+ color link")
                }
            }
        }
    }

    if(absettings("displayfollows")){
        let followerbtn= document.querySelector("h4.followers"); 
        if(followerbtn!=null){
            let container = document.getElementById("followers");
            if(followerbtn.classList.contains("selected")){
                getallfollowers(container);
    
            }else{
                followerbtn.addEventListener("click",()=>{
                    getallfollowers(container);
                },{once:true});
            }
        }
        let followingbtn= document.querySelector("h4.following"); 
        if(followingbtn!=null){
            let container = document.getElementById("following");
            if(followingbtn.classList.contains("selected")){
                getallfollowers(container);
    
            }else{
                followingbtn.addEventListener("click",()=>{
                    getallfollowers(container);
                },{once:true});
            }
        }
    }
    
    //notification blocker
    let notic = document.getElementById("notification_container");
    if(notic!=null&&absettings("blocknoti")){
        Noo.noticontainer = notic;
        Noo.startcheck();
    }

    let imagescontainer;
    if(USER=="browse"||USER=="i"){
        imagescontainer = document.querySelector("div.children_container");
    }else{
        imagescontainer = document.querySelector("div#images div.children_container");
    }
    
    if(imagescontainer!=null){
        Imo.imagecontainer = imagescontainer;
        Imo.startcheck();
        
        //selector stuff
        let selectordiv = document.getElementById("image-group-selector");
        if(selectordiv!=null){

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
                let imageContainer = Imo.imagecontainer;
                let images = imageContainer.childNodes;
                for (let i = 0; i < images.length; i++) {
                    images[i].classList.remove("selected");
                }
            });
        }

    } 

    

    
    //

}

function customstyle() {
    {
        let element = document.createElement('style'), sheet;
        element.id = "abpcustomstyle";
        document.head.appendChild(element);
        sheet = element.sheet;
        //logo
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
        //hover
        sheet.insertRule(".hoverpointer{cursor:pointer}", sheet.cssRules.length);
        // top img contaienr thingy
        sheet.insertRule(".abpbtm{display:flex; gap: 9px;}", sheet.cssRules.length);
        sheet.insertRule(".placeab{filter: drop-shadow(0 0 1px black);}", sheet.cssRules.length);
        sheet.insertRule(".modal,#abptopmodal.modal-body{overflow: hidden !important;}", sheet.cssRules.length);
        sheet.insertRule("#abptopmodal.modal-content{height: 96%;}", sheet.cssRules.length);
        sheet.insertRule(".abpheader{font-size:2rem;}", sheet.cssRules.length);
        sheet.insertRule("#abptopmodal .modal-body .images_container {max-height: 70vh;overflow: hidden auto;}", sheet.cssRules.length);
        //custom btns for download and upload at blocked users
        sheet.insertRule(".abpcstmbtn{cursor:pointer;filter: contrast(0%);width: 2rem;aspect-ratio: 1/1;border: 1px solid gray;border-radius: 5px;margin: 3px;padding: 3px;}", sheet.cssRules.length);
        // selected mode 
        sheet.insertRule(".text_button.selected {border-bottom: 1px solid white;}", sheet.cssRules.length);

    }
}

function addcolorsafe(color){
    //safe custom darkmode color to profile page
    let PARA = {
        headers:reqheader,
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
        headers:reqheader,
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
        headers:reqheader,
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
        headers:reqheader,
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
    let imageContainer = Imo.imagecontainer;
    let images = imageContainer.childNodes;
    for (let i = 0; i < images.length; i++) {
        if (images[i].classList.contains("selected")) {
            selected.push(images[i].getAttribute("data-key"));
        }
    }
    return selected;
}

function speeeen(){
    //speeeeeen
    let test = document.querySelectorAll("*");
    test.forEach(e => {
        e.style.transform = "rotate(" + 360 * (((Math.random() - .5))*10) + "deg)";
        e.style.transition = "transform 420s";
    });
}

function enabledarkmode(){
    let color = absettings("darkmodecolor");
    let element = document.createElement('style'),sheet;
    element.id = "darkmodestylesheet";
    document.head.appendChild(element);
    sheet = element.sheet;
    sheet.insertRule(".dropdown-content a,*,a,.header_option{color:#898989;}", sheet.cssRules.length);
    sheet.insertRule(".recent-tag,#image-tag-popup,.social,.notification,body,.modal-content{background:"+color+";}", sheet.cssRules.length);
    sheet.insertRule(".container,.text-container-inner,#image-group-selector,.model, .method,.button-group .option.selected,.card,.text-imagecontainer-inner,.dropdown-content,.taginfo,.usergene-info,.gene_controller,.user-pill,.header{background:"+shadeColor(color,-70)+";}", sheet.cssRules.length);
    sheet.insertRule(".image-tag,select,#preview,input,.button-group .option{background:#333;}", sheet.cssRules.length);
    sheet.insertRule(".gene_controller img{background:#999; border-radius:5px}", sheet.cssRules.length);
    sheet.insertRule("img[src='/image/loading_spinner.gif']{filter: invert(100%);}", sheet.cssRules.length)
    sheet.insertRule("#image-tag-popup input[type='text']{background:black !important;}",sheet.cssRules.length)
    sheet.insertRule(".repeat,.taginfo img,.user-links img{filter: drop-shadow(0px 0px 1px rgba(255, 255, 255, 1.0)) drop-shadow(0px 0px 4px rgba(255, 255, 255, 0.75)); background: none !important;}",sheet.cssRules.length)
}

function shadeColor(color, percent) {
    // credits to this kind person below
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

function getfilter(mode="browse"){
    filters={};

    let mo = document.querySelector(".model_options");
    if(mo!=null){
        filters.modeloption = "all";
        let am = 0;
        for (let i = 0; i < mo.children.length; i++) {
            if(!mo.children[i].classList.contains("inactive")){
                am++;
                filters.modeloption = mo.children[i].getAttribute("data-name");
            }
        }
        if(am>1){
            filters.modeloption = "all";
        }else{
            filters.modeloption = [filters.modeloption];
        }
    }
    //why a switch ? idk i thought ill have to add more modes but there rly is only need for 2
    switch(mode){
        case "browse":
            let bt = document.querySelector("#browse-type");
            if(bt==null)break;
            filters.browsetype = "trending";
            for (let i = 0; i < bt.children.length; i++) {
                if(bt.children[i].classList.contains("selected")){
                    filters.browsetype = bt.children[i].getAttribute("data-name");
                    break;
                }
            }
            break;
        case "user":
            let os = document.querySelector(".image_options #offset");
            if(os==null)break;
            filters.offset = os.value;
            let imf = document.querySelector(".image_options .img-filter");
            if(imf==null)break;
            filters.browsetype = "created";
            for (let i = 0; i < imf.children.length; i++) {
                if(imf.children[i].classList.contains("selected")){
                    filters.browsetype = imf.children[i].getAttribute("data-name");
                    break;
                }
            }
            let sof = document.querySelector(".image_options .img-order");
            if(sof==null)break;
            filters.order = "new";
            for (let i = 0; i < sof.children.length; i++) {
                if(sof.children[i].classList.contains("selected")){
                    filters.order = sof.children[i].getAttribute("data-name");
                    break;
                }
            }
            break;
        default:
            console.error("That is not a valid option.");
            break;
    }
    return filters;
}
    
function getlikes(){
    //go get em !
    let URL;
    let PARA={};
    PARA.method="POST"
    PARA.headers=reqheader;
    if(USER=="browse"){
        let filter = getfilter("browse");
        if(filter.browsetype=="random"||filter.browsetype=="search"){
            console.warn("cant fetch likes for "+ filter.browsetype);
            return;
        }
        PARA.body={
            "starred_by":"any",
            "models":filter.modeloption,
            "limit":Imo.likechecksize,
            "offset":Imo.likecheckoffset,
        };
        if(filter.browsetype=="following"){
            PARA.body.user_following=true;
        }
        if(filter.browsetype=="trending"){
            URL= "https://www.artbreeder.com/trending";
        }else{
            URL= "https://www.artbreeder.com/images";
        }
        PARA.body=JSON.stringify(PARA.body);
        
    }else if(USER=="i"){
        URL= "https://www.artbreeder.com/image_children";
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        const id = urlParams.get('k');
        PARA.body = JSON.stringify({
            "image_key":id,
            "limit":Imo.likechecksize,
            "offset":Imo.likecheckoffset,
        });
    }else{
        let filter = getfilter("user");
        if(filter.browsetype=="liked"||filter.browsetype=="liked&created"){
            console.warn("cant fetch likes for "+ filter.browsetype);
            return;
        }
        filter.offset = Math.abs(Number(filter.offset));
        URL= "https://www.artbreeder.com/images";
        PARA.body={
            order_by:"image_new.id",
            order:"desc",
            creator:USER,
            starred_by:null,
            uploaded:false,
            "models":filter.modeloption,
            "limit":Imo.likechecksize,
            "offset":Imo.likecheckoffset+filter.offset,
        };
        if(filter.order=="popular"){
            PARA.body.order_by="likes";
        }
        if(filter.order=="old"){
            PARA.body.order="asc";
        }
        if(filter.browsetype=="uploaded"){
            PARA.body.uploaded=true;
        }

        PARA.body=JSON.stringify(PARA.body);
    }
    fetch(URL,PARA)
    .then(response => {
    if (!response.ok) {
        throw new Error("HTTP error " + response.status);
    }
    return response.json();
    })
    .then(data=>{
        setTimeout(()=>{
            displayLikes(data);
        },500);
    })
    .catch(err=>{console.error(err)});
}

function displayLikes(likes){
    
    if(likes[0].likes===undefined){
        console.error("likes arent defined in data",likes);
        return;
    }

    let imageContainer = Imo.imagecontainer;
    let images = imageContainer.childNodes;
    for (let i = 0; i < images.length; i++) {
        if(images[i].lastChild==null){
            continue;
        }
        if(images[i].querySelector("#abpluslikedisplay")!=null){
            continue;
        }
        let likeHTML = document.createElement("p");
        likeHTML.classList.add("time_string");
        likeHTML.id="abpluslikedisplay";
        likeHTML.style = "display: flex;align-items: center; margin-right:5px;" ;
        //find likes 
        let likeam="error";
        for (let j = 0; j < likes.length; j++) {
            if(likes[j].key==images[i].getAttribute("data-key")){
                likeam = likes[j].likes;
            }
        }
        if(likeam=="error"){
            continue;
        }
        if(likeam===null){likeam=0}
        likeHTML.innerText  = likeam;
        images[i].lastChild.firstChild.insertBefore(likeHTML,images[i].lastChild.firstChild.childNodes[0]);
        
    }
}