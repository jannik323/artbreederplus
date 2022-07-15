// (()=>{
    
// I just wanna say ... I know its not pretty
// and most of the code isn't efficient
// I just made this for fun and didn't really think of those things.
// ive added some comments to make it more understandable

// default abp settings
const defaultsettings = {
    displaylikes:true,
    blocknoti:true,
    imgblocks:false,
    displayfollows:false,
    displaytopimgs:false,
    darkmode:true,
    darkmodecolor:"#222222",
    customcss:"",
    customcssactive:false,
    sliderform:"normal",
    convertslider:false,
    negativegenes:true,
    blockedtags:[],
    blocktagtimeout:600000,
    blocktagmaximgs:33,
    blocking:true
}

// current last path of the url
const LASTPATH = findLastPath();

// for the abpnotifications page
let requestingnotif=false;

// for the automatic tag blocking updating 
const abpWinId = Date.now(); 

//defaulting or updating abp settings localstorage
checkAbpSettings();

// image observer
const Imo= {

    size:0,
    imagecontainer:null,
    checkloop:null,
    likechecksize:0,
    likecheckoffset:0,
    displaylikes:absettings("displaylikes"),
    blocking:true,
    canblockimgs:absettings("imgblocks"),


    startcheck(blocking=true){
        Imo.blocking=blocking;
        setTimeout(() => {Imo.checkloop = setInterval(Imo.checkimagechange, 100)}, 200);
        if(Imo.blocking){
            removeblockedimgs();
        }
        addMiscUtilToImage();
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
            if(Imo.blocking){
                removeblockedimgs();
            }
            addMiscUtilToImage();
            if(Imo.displaylikes){
                getlikes();
            }
        }
    }
}

// notification observer / blocker
const Noo= {

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

// tag blocker
const tagblocker= {

    checkloop:null,
    currentblocks:null,
    timeoutlength:600000,

    start(){
        let settings = absettings("all");
        tagblocker.currentblocks=settings.blockedtags;
        tagblocker.timeoutlength=settings.blocktagtimeout;
    },

    startcheck(){
        setTimeout(() => {tagblocker.checkloop = setInterval(tagblocker.checktimeouts, 10000)}, 100);
    },

    stopcheck(){
        clearInterval(tagblocker.checkloop);
    },

    checktimeouts(){
        let currentmain = JSON.parse(localStorage.getItem("abplus-main-win")); // to make sure only one window updates the blocks
        if(currentmain.id===abpWinId||currentmain.time-Date.now()<-20000){
            localStorage.setItem("abplus-main-win",JSON.stringify({id:abpWinId,time:Date.now()}));
            tagblocker.currentblocks.forEach(e=>{
                if(e.timeout-Date.now()<=0){
                    let savedblock=absettings("blockedtags");
                    let tagindex = savedblock.findIndex(tagobj=>e.tag===tagobj.tag);
                    if(tagindex!=-1){
                        tagblockimages(e.tag);
                        savedblock[tagindex].timeout=Date.now()+tagblocker.timeoutlength;
                        absettings("blockedtags",true,savedblock);
                        tagblocker.currentblocks=savedblock;
                    }  
                    
                }
            })
        }
        
    }
}

// http default request header
const reqheader = {
    "Accept": "application/json",
    "Content-Type": "application/json",
};

//main function
function start(){

    if(absettings("darkmode")){
        enabledarkmode();
    }

    //defaulting other localstorage
    if(localStorage.getItem("abplus-blocked")==null){
        localStorage.setItem("abplus-blocked",JSON.stringify([]));
    }

    if(localStorage.getItem("abplus-blocked-img")==null){
        localStorage.setItem("abplus-blocked-img",JSON.stringify([]));
    }

    if(localStorage.getItem("abplus-blocked-tag-img")==null){
        localStorage.setItem("abplus-blocked-tag-img",JSON.stringify([]));
    }

    if(localStorage.getItem("abplus-main-win")==null){
        localStorage.setItem("abplus-main-win",JSON.stringify({id:0,time:0}));
    }

    let absettingsTemp = absettings("all");

    // group-selector thingys
    if(window.group_selector!=null){
        window.group_selector.element=document.getElementById("image-group-selector");
        window.group_selector.counter=document.querySelector("#image-group-selector #count").firstChild;
    }

    // topimgs thing
    if(absettingsTemp.displaytopimgs){

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

        if(LASTPATH==="browse"){

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
        dropdown.prepend(btn);
    }else{
        dropdown = document.querySelector("div.header-right");
        if(dropdown!=null){
            let btn = document.createElement("a");
            btn.classList.add("header_option");
            btn.innerText = "AB+ Settings";
            btn.href = "/artbreederplus";
            dropdown.prepend(btn);
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


    //notification btn link
    let notibtn = document.querySelector(".notifications .dropdown-button");
    if(notibtn&&notibtn.firstChild!=null){
        let link = document.createElement("a");
        link.href="/abpnotifications";
        link.classList.add("invislinkabp");
        notibtn.appendChild(link);
    }


    // slider change
    let upperpath = findLastPath(1);
    if(LASTPATH=="i"||upperpath=="mix"||upperpath=="compose"||upperpath=="create_gene"){
        let form = absettingsTemp.sliderform;
        if(form!="normal"){
            let isconvert = absettingsTemp.convertslider;
            let convertloop;
            if(isconvert){
                convert();
                convertloop = setInterval(()=>{ // lazy way of converting new sliders lol
                    convert();
                },500)
            }
            if(form=="toggle"){
                let slidertoggle = document.createElement("div");
                slidertoggle.id="togglebtnslider";
                slidertoggle.classList.add("hoverpointer");
                slidertoggle.classList.add("delete");
                let toggle = document.createElement("span");
                toggle.innerText="SLIDER";
                if(isconvert){
                    toggle.innerText="NUMBER";
                }

                slidertoggle.onclick=()=>{
                    if(toggle.innerText=="NUMBER"){
                        toggle.innerText="SLIDER"
                        clearInterval(convertloop);
                        convert(false);
                        absettings("convertslider",true,false);
                    }else{
                        toggle.innerText="NUMBER";
                        convert();
                        convertloop = setInterval(()=>{
                            convert();
                        },500)
                        absettings("convertslider",true,true);
                    }
                }
                
                slidertoggle.appendChild(toggle)
                document.body.appendChild(slidertoggle);

            }
        }
        function convert(state=true){
            if(state){
                let sliders = document.querySelectorAll("input[type='range']");
                sliders.forEach(e=>{
                    e.type="number";
                    e.setAttribute("abpconverted","number");
                    e.style.height="20px";
                })
            }else{
                sliders = document.querySelectorAll("input[abpconverted='number']");
                sliders.forEach(e=>{
                    e.type="range";
                    e.setAttribute("abpconverted","range");
                    e.style.height="5px";
                })
            }
        }
    }

    //negative genes
    if(upperpath=="create_gene"){
        if(absettingsTemp.negativegenes){
            document.getElementById("negative-images").classList.remove("hidden");
        }
    }
    
    //notifications page
    if(LASTPATH=="abpnotifications"){

        cleanpage();

        {//title
            let titlediv = document.createElement("div");
            titlediv.classList.add("row","title_row");
            let title = document.createElement("h1");
            title.classList.add("inline");
            title.innerText="Notifications";
            titlediv.appendChild(title);
            document.body.appendChild(titlediv);
        }

        let list = document.createElement("ul");
        list.classList.add("abpnotiholder");
        list.style.height =" 80%";
        list.style.listStyle="none";
        list.style.padding="0px";
        list.style.display="flex";
        list.style.alignItems="center"
        list.style.flexDirection="column"

        document.body.appendChild(list);
        requestingnotif = false;

        window.addEventListener('scroll', function() {
            if(!requestingnotif&&window.pageYOffset+window.innerHeight>document.body.clientHeight-500){
                getnotifications(list,list.childElementCount);
                requestingnotif=true;
            }
        });
        getnotifications(list);

    }

    // ab+ page
    if(LASTPATH=="artbreederplus"){
        createAbpPage(absettingsTemp);
    }

    //block button stuff
    let profilediv = document.querySelector("div.top_row div.profile div.buttons_container");
    if(profilediv!=null){
        let blockbtn = document.createElement("button");
        let savedblock = JSON.parse(localStorage.getItem("abplus-blocked"));
        if(savedblock.includes(LASTPATH)){
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
                return LASTPATH === user;
            });
            if(userindex!=-1){
                blocked.splice(userindex,1);
                blockbtn.innerText="block";
            }else{
                blocked.push(LASTPATH);
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
                    changedarkmode(element,color);
                }else{
                    console.log("not a ab+ user / not a ab+ color link")
                }
            }
        }
    }


    //custom css
    if(absettingsTemp.customcssactive){
        let element = document.createElement('style');
        element.id="customusercssabp";
        element.innerHTML = absettingsTemp.customcss;
        document.body.appendChild(element);
    }

    //display follows in user/followers
    if(absettingsTemp.displayfollows){
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
    if(absettingsTemp.blocking&&notic!=null&&absettingsTemp.blocknoti){
        Noo.noticontainer = notic;
        Noo.startcheck();
    }

    //tag blocker
    if(absettingsTemp.blocking){
        tagblocker.start();
        tagblocker.startcheck();
    }

    //find the imagecontainer
    let imagescontainer;
    if(LASTPATH=="browse"||LASTPATH=="i"||findLastPath(1)=="compose"){
        imagescontainer = document.querySelector("div.children_container");
    }else{
        imagescontainer = document.querySelector("div#images div.children_container");
    }
    
    if(imagescontainer!=null){

        //img observer (add like, selection listener, blocking )
        Imo.imagecontainer = imagescontainer;
        Imo.startcheck(absettingsTemp.blocking);
        //

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
                let images = Imo.imagecontainer.childNodes;
                for (let i = 0; i < images.length; i++) {
                    images[i].classList.remove("selected");
                }
            });
        }

    } 
    //

}

// find the last path string in the url
function findLastPath(offset=0){
    let urlsplit = window.location.pathname.split("/");
    if(urlsplit.length-(offset+1)<0)return "";
    return urlsplit[urlsplit.length-(offset+1)]; 
}

// adds different things to images in the imageobserver 
// selector event listener , delete btn, block btn
function addMiscUtilToImage(){
    let imageContainer = Imo.imagecontainer;
    let canblockimgs = Imo.canblockimgs;
    let images = imageContainer.childNodes;
    for (let i = 0; i < images.length; i++) {

        if(!images[i].getAttribute("abplus-modified")){
            images[i].setAttribute("abplus-modified",true);

            // selector click event
            images[i].addEventListener("click",e=>{
                if(e.altKey){
                    if(images[i].classList.contains("selected")){
                        window.group_selector.images.delete(e.target.parentElement.parentElement)
                    }else{
                        window.group_selector.images.add(e.target.parentElement.parentElement)
                    }
                    images[i].classList.toggle("selected");
                    window.group_selector.checkForReset();
                    window.group_selector.counter.innerText=window.group_selector.images.size+":";
                    window.group_selector.images.size==0 ? window.group_selector.element.classList.add("hidden") : window.group_selector.element.classList.remove("hidden");
                }
            })

            //add block btn
            if(canblockimgs){
                let x = document.createElement("img");
                x.classList.add("remove");
                x.classList.add("image_opt");
                x.src="/svg/x.svg";
                x.onclick=()=>{
                    let blockimgs=JSON.parse(localStorage.getItem("abplus-blocked-img"));
                    blockimgs.push(images[i].getAttribute("data-key"));
                    localStorage.setItem("abplus-blocked-img",JSON.stringify(blockimgs));
                    images[i].style.display="none";
                }
                images[i].prepend(x);
            }

            // delete btn
            let imagebtm = images[i].querySelector(".image-opts");
            if(imagebtm!=null&&window.username==images[i].querySelector("a.creator_name").innerText){
                let deletebtn = document.createElement("div");
                deletebtn.classList.add("image_opt");
                deletebtn.classList.add("delete");
                deletebtn.onclick=()=>{
                    if(confirm("Are you sure you want to delete this image? You cannot undo this.")){
                        deleteimage(images[i].getAttribute("data-key"));      
                        images[i].style.display="none";
                    }
                }
                imagebtm.appendChild(deletebtn);
            }
        }

        
    }
}
    
//removes blocked imgs
function removeblockedimgs(){
    let savedblock = JSON.parse(localStorage.getItem("abplus-blocked"));
    let savedblockimg = JSON.parse(localStorage.getItem("abplus-blocked-img"));
    let savedblocktagimg = JSON.parse(localStorage.getItem("abplus-blocked-tag-img"));
    if(savedblock.includes(LASTPATH)){
        console.log("stopped blocking images by "+LASTPATH+ " temporary. User is on their profile page.");
        return;
    }
    let imageContainer = Imo.imagecontainer;
    let images = imageContainer.childNodes;
    let deletecount=0;
    let canblockimgs = absettings("imgblocks");
    imgloop:for (let i = 0; i < images.length; i++) {
        let ikey = images[i].getAttribute("data-key"); 
        if(images[i].lastChild==null||images[i].style.display==="none"||ikey==null){
            continue;
        }
        
        if(canblockimgs&&savedblockimg.includes()){
            images[i].style.display =" none";
            deletecount++;
            continue;
        }
        for(let i2 =0;i2<savedblocktagimg.length;i2++){
            if(savedblocktagimg[i2].imgs.includes(ikey)){
                images[i].style.display =" none";
                deletecount++;
                continue imgloop; //ignore this
            }
        };
        
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

// removes blocked notifications
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

// makes sure the abp settings are valid
function checkAbpSettings(){
    let settings =  JSON.parse(localStorage.getItem("abplus-settings"));

    //missing abp settings
    if(!settings){
        settings = defaultsettings;
        localStorage.setItem("abplus-settings",JSON.stringify(settings));
    }

    //different amount of settings -> current local settings need to be updated
    if(Object.keys(defaultsettings).length!=Object.keys(settings).length){
        for (let p in defaultsettings) {
            // missing setting that the local settings dont have
            settings[p] = settings[p]??defaultsettings[p]; 
        }
        for (let p in settings) {
            // something in local settings has a different name now or was removed
            if(defaultsettings[p]==undefined){
                delete settings[p];
            }
        }
        localStorage.setItem("abplus-settings",JSON.stringify(settings));
    }
}

//changes the abp settings or returns them
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

// gets overall top images from artbreeder -> recursive
// options can be : tags[],searchmode,model
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

// display the top images in a custom popup window
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

// find all the followercounts for the users in the container
// this solution.....lets just say its.. something
// wouldnt recommend using it
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

//helper function for getallfollowers
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

// changes the current userpage link to a link that has a color injected
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

// adds or removes selected tag to selected images
function addtags(tag,remove=false){
    if(!tag){alert("please enter a valid tag name"); return;}
    let selected = getselected();
    let isokay;
    if(remove){
        isokay = confirm("Do you want to remove the tag "+ tag +" from " +selected.length+" images?");
    }else{
        isokay = confirm("Do you want to add the tag "+ tag +" to " +selected.length+" images?");
    }
    if(!isokay)return;
    selected.forEach(key => {
        changetag(key,tag,remove);
    });
    window.group_selector.clear();
}

// deletes all selected images
function deleteimages(){
    let selected = getselected();
    let isokay = confirm("Do you want to delete "+selected.length+" images? You can't revert this !");
    if(!isokay)return;
    selected.forEach(key => {
        deleteimage(key);
    });
    window.group_selector.clear();
}

// privates or unprivates all selected images
function privateimages(isprivate=true){
    let selected = getselected();
    let isokay;
    if(isprivate){
        isokay = confirm("Do you want to private "+selected.length+" images?");
    }else{
        isokay = confirm("Do you want to make "+selected.length+" images public?");
    }
    if(!isokay)return;
    selected.forEach(key => {
        privateimage(key,isprivate);
    });
    window.group_selector.clear();
}

// change a tag from a specified img
function changetag(key,tag,remove=false){
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

// delete a specified img
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

// private or unprivate a specified image
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

//gets all selected images and returns them
function getselected() {
    return Array.from(window.group_selector.images).map(e=>e.dataset.key);
}

//speeeeeeen
function speeeen(){
    //speeeeeen
    let test = document.querySelectorAll("*");
    test.forEach(e => {
        e.style.transform = "rotate(" + 360 * (((Math.random() - .5))*10) + "deg)";
        e.style.transition = "transform 420s";
    });
}

//injects the darkmode stylesheet
function enabledarkmode(){
    let color = absettings("darkmodecolor");
    let element = document.createElement('style'),sheet;
    element.id = "darkmodestylesheet";
    document.head.appendChild(element);
    sheet = element.sheet;
    sheet.insertRule(".dropdown-content a,*,a,.header_option{color:#898989;}", sheet.cssRules.length);
    sheet.insertRule("#togglebtnslider span,.recent-tag,#image-tag-popup,.social,.notification,body,.modal-content{background:"+color+" !important;}", sheet.cssRules.length);
    sheet.insertRule("#gene-preview,.flex-container-inner,#togglebtnslider,.abpnotification,.container,.text-container-inner,#image-group-selector,.model, .method,.button-group .option.selected,.card,.text-imagecontainer-inner,.dropdown-content,.taginfo,.usergene-info,.gene_controller,.user-pill,.header{background:"+shadeColor(color,-70)+" !important;}", sheet.cssRules.length);
    sheet.insertRule(".image-tag,select,#preview,input,.button-group .option{background:#333;}", sheet.cssRules.length);
    sheet.insertRule(".gene_controller img{background:#999; border-radius:5px}", sheet.cssRules.length);
    sheet.insertRule("img[src='/image/loading_spinner.gif']{filter: invert(100%);}", sheet.cssRules.length)
    sheet.insertRule("#image-tag-popup input[type='text']{background:black !important;}",sheet.cssRules.length)
    sheet.insertRule(".repeat,.taginfo img,.user-links img{filter: drop-shadow(0px 0px 1px rgba(255, 255, 255, 1.0)) drop-shadow(0px 0px 4px rgba(255, 255, 255, 0.75)); background: none !important;}",sheet.cssRules.length)
    sheet.insertRule(".gene_controller{border:1px solid black}",sheet.cssRules.length);
    sheet.insertRule(".gene_controller input.number_input{filter:invert()}",sheet.cssRules.length);
    sheet.insertRule("textarea{color:white}",sheet.cssRules.length);
}

//change primary (and secondary) color of the darkmode stylesheet
function changedarkmode(element=null,color=absettings("darkmodecolor")){
    if(element==null){
        element=document.getElementById("darkmodestylesheet")
    }
    if(element==null)return;
    let sheet = element.sheet;
    sheet.cssRules[1].style.setProperty("background",color,"important");
    sheet.cssRules[2].style.setProperty("background",shadeColor(color,-70),"important");
    // sheet.cssRules[1].style.setPro = color ;
    // sheet.cssRules[2].style.background = shadeColor(color,-70)+" !important;";
}

//removes the darkmode stylesheet
function disabledarkmode(){
    let darkmodes = document.querySelectorAll("#darkmodestylesheet")
    darkmodes.forEach(e=>{e.remove()});
}

// returns a shaded version of the color provided
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

// gets the current filter options (which model, mode, search)
function getfilter(mode="browse"){
    let filters={};

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
    
// find the current like count for images on the current page
function getlikes(){
    //go get em !
    let URL;
    let PARA={};
    PARA.method="POST"
    PARA.headers=reqheader;
    if(LASTPATH=="browse"){
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
        
    }else if(LASTPATH=="i"){
        URL= "https://www.artbreeder.com/image_children";
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        const id = urlParams.get('k');
        PARA.body = JSON.stringify({
            "image_key":id,
            "limit":Imo.likechecksize,
            "offset":Imo.likecheckoffset,
        });
    }else if(findLastPath(1)=="compose"){
        URL= "https://www.artbreeder.com/images";
        PARA.body = JSON.stringify({
            creation_type:6,
            models:[window.model_name],
            creator: window.username,
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
            creator:LASTPATH,
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

//display / inject the provided like data into the images on the page
function displayLikes(likes){
    
    if(likes[0].likes===undefined){
        console.error("likes arent defined in data",likes);
        return;
    }

    let imageContainer = Imo.imagecontainer;
    let images = imageContainer.children;
    for (let i = 0; i < images.length; i++) {
        if(images[i].lastChild==null||images[i].style.display=="none"){
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
        images[i].lastChild.firstChild.prepend(likeHTML);
        
    }
}

// request and get the current artbreeder notifications 
function getnotifications(list,offset=0){
    let PARA = {};
        PARA.method="POST"
        PARA.headers=reqheader;
        PARA.body=JSON.stringify({
            limit:20,
            offset:offset,
        });
        fetch("https://www.artbreeder.com/get_notifications",PARA)
        .then(response => {
        if (!response.ok) {throw new Error("HTTP error " + response.status);}
        return response.json();})
        .then(data=>{
            createnotis(list,data);
        })
        .catch(err=>{console.error(err)});
}

// create notification elements for the abpnotifications page
function createnotis(list,data){
    let savedblock = JSON.parse(localStorage.getItem("abplus-blocked"));
    data.forEach(e=>{
        if(savedblock.includes(e.username)){
            let blocked = document.createElement("li");
            blocked.innerText="blocked";
            blocked.style.display="none";
            list.appendChild(blocked);
            return;
        };
        createnoti(list,e.type,e.created_at,e.time_string,e.is_new,e.key,e.username,e.profile_img_key,e.data);
    })
    requestingnotif=false;
}

// creates a single notification element for the abpnotifications page
function createnoti(list,type,date,time_string,isnew,key,username,userprofile,newkey){
    
    if(newkey!=null){
        newkey=newkey.child_key;
    }
    let noti = document.createElement("li");
    noti.classList.add("abpnotification");
    let userdiv = document.createElement("div");
    userdiv.classList.add("userdiv");
    userdiv.classList.add("hoverpointer");
    userdiv.onclick=()=>{window.open("/"+username)};
    let userimg = document.createElement("img");
    let usernamespan = document.createElement("span");
    if(userprofile==null){
        userimg.src = "https://www.artbreeder.com/image/empty.png";
        usernamespan.style.bottom="40%";
    }else{
        userimg.src = "https://artbreeder.b-cdn.net/imgs/"+userprofile+"_small.jpeg?height=100";
    }
    userdiv.appendChild(userimg);
    usernamespan.innerText = username;
    userdiv.appendChild(usernamespan);
    noti.appendChild(userdiv);

    let typediv = document.createElement("div");
    typediv.classList.add("typediv");

    let typespan = document.createElement("span");
    switch(type){
        case 1: // like
        typespan.innerText="liked your image ";
        break;
        case 2: // follow
        typespan.innerText="followed you ";
        break;
        case 3: // breed
        typespan.innerText="has bred your image ";
        break;
    }
    typediv.appendChild(typespan);

    let typetime = document.createElement("span");
    typetime.innerText = time_string;
    typediv.appendChild(typetime);
    noti.appendChild(typediv);

    let imgdiv = document.createElement("div");
    imgdiv.classList.add("imgdiv");
    let oldimg = document.createElement("img");
    oldimg.classList.add("hoverpointer");
    let newimg = document.createElement("img");
    newimg.classList.add("hoverpointer");
    switch(type){
        case 1:
            oldimg.src = "https://artbreeder.b-cdn.net/imgs/"+key+"_small.jpeg?height=100";
            oldimg.onclick=()=>{window.open("/i?k="+key)};
            imgdiv.appendChild(oldimg);
            noti.appendChild(imgdiv);
            break;
        case 2:
            break;
        case 3:
            oldimg.src = "https://artbreeder.b-cdn.net/imgs/"+key+"_small.jpeg?height=100";
            oldimg.onclick=()=>{window.open("/i?k="+key)};
            imgdiv.appendChild(oldimg);

            let arrow = document.createElement("span");
            arrow.innerText="→";
            imgdiv.appendChild(arrow);

            newimg.src = "https://artbreeder.b-cdn.net/imgs/"+newkey+"_small.jpeg?height=100";
            newimg.onclick=()=>{window.open("/i?k="+newkey)};
            imgdiv.appendChild(newimg);
            noti.appendChild(imgdiv);
            break;
    }

    if(isnew){
        noti.style.border="1px solid green";
    }
    
    list.appendChild(noti);

}

// clears the whole page except a few elements (mainly for the abpnotifications and abpsettings page)
function cleanpage(){
    let repeat =false;
        do{
            let bodychildren = document.body.children;
            repeat =false;
            for (let i = 0; i < bodychildren.length; i++) {
            if(bodychildren[i].classList.contains("header")||bodychildren[i].nodeName==="SCRIPT"||bodychildren[i].nodeName==="STYLE"){
                    continue;
                };
                repeat=true;
                bodychildren[i].remove();
            }
        }while(repeat);
}

// find images with the specified tag and add them to the tagblock list
function tagblockimages(tag){
    return new Promise((resolve,reject)=>{
        let PARA = {};
        PARA.method="POST"
        PARA.headers=reqheader;
        PARA.body=JSON.stringify({
            tags:[tag],
            tag_search_type:"substring",
            models:"all",
            offset:0,
            limit:absettings("blocktagmaximgs"),
            order_by:null
        });
        fetch("https://www.artbreeder.com/images",PARA)
        .then(response => {
            if (!response.ok) {
                throw new Error("HTTP error " + response.status);
            }
            return response.json();
        })
        .then(data=>{
            let blocks = JSON.parse(localStorage.getItem("abplus-blocked-tag-img"));
            let tagblocks = absettings("blockedtags");

            let tagindex = blocks.findIndex(e=>tag===e.tag);
            if(tagindex==-1){
                blocks.push({tag:tag,imgs:[]});
                data.forEach(e=>{blocks[blocks.length-1].imgs.push(e.key);});
            }else{
                data.forEach(e=>{blocks[tagindex].imgs.push(e.key);});
            }
            blocks = blocks.filter(e=>tagblocks.some(e2=>e2.tag===e.tag));

            localStorage.setItem("abplus-blocked-tag-img",JSON.stringify(blocks));
    
            let i = tagblocks.findIndex(e=>tag===e.tag);
            if(i!=-1){
                tagblocks[i].count=data.length;
            }
            absettings("blockedtags",true,tagblocks);
            resolve();
        })
        .catch(err=>{console.error(err);reject();});
    });
    
}

// create the abp page (https://www.artbreeder.com/artbreederplus)
function createAbpPage(absettingsTemp) {
    cleanpage();
    let abpdiv = document.createElement("div");
    abpdiv.classList.add("abp-center");
    document.body.appendChild(abpdiv);
    document.body.style="background:white"

    { //title
        let titlediv = document.createElement("div");
        titlediv.classList.add("row", "title_row");
        let title = document.createElement("h1");
        title.classList.add("inline");
        title.innerText = "Artbreeder+ Settings";
        titlediv.appendChild(title);
        abpdiv.appendChild(titlediv);
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
        input.type = "color";
        input.value = "#222222";
        input.value = absettingsTemp.darkmodecolor;
        input.addEventListener("change", e => {
            absettings("darkmodecolor", true, e.target.value);
            changedarkmode();
            let isokay = confirm("Do you want to overwrite the website link on your profile page in order to share your color theme with other visitors ?");
            if (isokay) { addcolorsafe(e.target.value); }
        });

        let text = document.createElement("span");
        text.innerText = "Custom Darkmode Color: ";
        let title = document.createElement("h3");
        title.innerText = "Darkmode Settings";
        title.style.marginTop = "0px";
        let reset = document.createElement("button");
        reset.classList.add("primary_button");
        reset.innerText = "Reset";
        reset.addEventListener("click", () => {
            let color = "#222222";
            input.value = color;
            absettings("darkmodecolor", true, color);
            changedarkmode();
            let isokay = confirm("Do you want to overwrite the website link on your profile page in order to share your color theme with other visitors ?");
            if (isokay) { addcolorsafe(color); }
        });

        //toggle darkmode
        let ison = absettingsTemp.darkmode;
        let check = document.createElement("input");
        check.type = "checkbox";
        check.id = "darkmode-check-menu";
        check.checked = ison;
        check.addEventListener("change", (e) => {
            absettings("darkmode", true, e.target.checked);
            ison = e.target.checked;
            if (ison) {
                enabledarkmode();
            } else {
                disabledarkmode();
            }
        });
        let label = document.createElement("label");
        label.innerText = "Darkmode";
        label.classList.add("hoverpointer");
        label.setAttribute("for", "darkmode-check-menu");


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

        abpdiv.appendChild(div);
        abpdiv.appendChild(document.createElement("br"));
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
        title.innerText = "Block Settings";
        title.style.marginTop = "0px";
        title.style.display = "inline";
        card.appendChild(title);

        let blockcheck = document.createElement("input");
        let bdc = document.createElement("div");

        blockcheck.type = "checkbox";
        blockcheck.checked = absettingsTemp.blocking;
        if (!absettingsTemp.blocking) {
            bdc.style.display = "none";
        }
        blockcheck.addEventListener("change", (e) => {
            absettings("blocking", true, e.target.checked);
            if (e.target.checked) {
                bdc.style.display = "block";
            } else {
                bdc.style.display = "none";
            }
        });


        card.appendChild(blockcheck);
        bdc.appendChild(document.createElement("br"));

        card.appendChild(bdc);



        bdc.appendChild(document.createElement("hr"));


        //image block
        let blockedimgscount = document.createElement("h4");
        let clearimgblockbtn = document.createElement("button");

        {
            let ison = absettingsTemp.imgblocks;
            let check = document.createElement("input");
            check.type = "checkbox";
            check.id = "imgblocks-check-menu";
            check.checked = ison;
            if (!ison) {
                blockedimgscount.style.display = "none";
                clearimgblockbtn.style.display = "none";
            }
            check.addEventListener("change", (e) => {
                absettings("imgblocks", true, e.target.checked);
                ison = e.target.checked;
                if (e.target.checked) {
                    blockedimgscount.style.display = "block";
                    clearimgblockbtn.style.display = "inline";
                } else {
                    blockedimgscount.style.display = "none";
                    clearimgblockbtn.style.display = "none";
                }
            });
            let label = document.createElement("label");
            label.innerText = "Block Specific Images";
            label.classList.add("hoverpointer");
            label.setAttribute("for", "imgblocks-check-menu");
            bdc.appendChild(label);
            bdc.appendChild(check);
            bdc.appendChild(document.createElement("br"));
        }

        let blockedimg = JSON.parse(localStorage.getItem("abplus-blocked-img"));
        blockedimgscount.innerText = "Blocked Images (" + blockedimg.length + ")";
        if (blockedimg.length > 50) {
            if (confirm("Do you want to clear your image blocks ? Its best to not have that many image blocks. You wont see most of the  blocked images again anyways.")) {
                localStorage.setItem("abplus-blocked-img", JSON.stringify([]));
                blockedimgscount.innerText = "Blocked Images (0)";
            }
        }
        blockedimgscount.style.marginBottom = "0px";
        blockedimgscount.style.marginTop = "1rem";
        bdc.appendChild(blockedimgscount);

        clearimgblockbtn.innerText = "Clear Image Blocks";
        clearimgblockbtn.onclick = () => {
            localStorage.setItem("abplus-blocked-img", JSON.stringify([]));
            blockedimgscount.innerText = "Blocked Images (0)";
        };
        bdc.appendChild(clearimgblockbtn);

        bdc.appendChild(document.createElement("hr"));

        // user block   
        let blocked = JSON.parse(localStorage.getItem("abplus-blocked"));

        let blockedusertitle = document.createElement("h4");
        blockedusertitle.innerText = "Blocked Users (" + blocked.length + ")";
        blockedusertitle.style.marginBottom = "0px";
        blockedusertitle.style.marginTop = "2rem";
        blockedusertitle.id = "abpblockedtitle";
        bdc.appendChild(blockedusertitle);

        let list = document.createElement("ul");
        list.style.height = " 200px";
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
        blockbtn.onclick = () => {
            if (!blockfield.value) {
                alert("please enter a valid user name !");
                return;
            }
            let blocked = [];
            let savedblock = JSON.parse(localStorage.getItem("abplus-blocked"));
            if (savedblock != null) { blocked = savedblock; }
            if (blocked.includes(blockfield.value)) {
                alert("user is already blocked!");
                return;
            }
            blocked.push(blockfield.value);
            localStorage.setItem("abplus-blocked", JSON.stringify(blocked));
            addblockelement(blockfield.value, list);
            blockfield.value = "";
        };
        blockdiv.appendChild(blockfield);
        blockdiv.appendChild(blockbtn);


        let download = document.createElement("img");
        download.classList.add("abpcstmbtn");
        download.src = "/svg/download.svg";
        download.onclick = () => {
            let tocopy = JSON.parse(localStorage.getItem("abplus-blocked"));
            navigator.clipboard.writeText(tocopy);
            alert("The block list \n\n" + tocopy + "\n\n has been copied to your clipboard!");
        };
        blockdiv.appendChild(download);

        let upload = document.createElement("img");
        upload.classList.add("abpcstmbtn");
        upload.src = "/svg/upload.svg";
        upload.onclick = () => {
            let data = (prompt("Please paste your data in:")).split(",");
            localStorage.setItem("abplus-blocked", JSON.stringify(data));
            while (list.hasChildNodes()) {
                list.removeChild(list.firstChild);
            }
            data.forEach(block => {
                addblockelement(block, list);
            });

        };
        blockdiv.appendChild(upload);

        let clear = document.createElement("img");
        clear.classList.add("abpcstmbtn");
        clear.src = "/svg/trash.svg";
        clear.onclick = () => {
            let data = [];
            while (list.hasChildNodes()) {
                list.removeChild(list.firstChild);
            }
            blockedusertitle.innerText = "Blocked Users (" + list.children.length + ")";
            localStorage.setItem("abplus-blocked", JSON.stringify(data));
        };
        blockdiv.appendChild(clear);




        bdc.appendChild(list);
        bdc.appendChild(blockdiv);
        bdc.appendChild(document.createElement("br"));
        //noti block
        {
            let ison = absettingsTemp.blocknoti;
            let check = document.createElement("input");
            check.type = "checkbox";
            check.id = "blocknoti-check-menu";
            check.checked = ison;
            check.addEventListener("change", (e) => {
                absettings("blocknoti", true, e.target.checked);
                ison = e.target.checked;
                if (ison) {
                    let notic = document.getElementById("notification_container");
                    if (notic != null) {
                        Noo.noticontainer = notic;
                        Noo.stopcheck();
                        Noo.startcheck();
                    }
                } else {
                    Noo.startcheck();
                }
            });
            let label = document.createElement("label");
            label.innerText = "Block Notifications Of Blocked User";
            label.classList.add("hoverpointer");
            label.setAttribute("for", "blocknoti-check-menu");
            bdc.appendChild(label);
            bdc.appendChild(check);
        }

        bdc.appendChild(document.createElement("hr"));

        //tag block
        let blockedtags = absettingsTemp.blockedtags;

        let blockedtagtitle = document.createElement("h4");
        blockedtagtitle.innerText = "Blocked Tags (" + blockedtags.length + ")";
        blockedtagtitle.style.marginBottom = "0px";
        blockedtagtitle.style.marginTop = "2rem";
        blockedtagtitle.id = "abpblockedtagtitle";
        bdc.appendChild(blockedtagtitle);

        let taglist = document.createElement("ul");
        taglist.style.height = " 200px";
        taglist.style.overflowY = "auto";
        taglist.style.border = "1px solid grey";
        blockedtags.forEach(block => {
            addtagblockelement(block, taglist);
        });
        bdc.appendChild(taglist);

        let tagblockdiv = blockdiv.cloneNode(true);
        bdc.appendChild(tagblockdiv);
        tagblockdiv.childNodes[0].placeholder = "tag name";
        tagblockdiv.childNodes[1].innerText = " Block Tag";
        tagblockdiv.childNodes[1].onclick = () => {
            let tagtoblock = tagblockdiv.childNodes[0].value;
            if (!tagtoblock) {
                alert("please enter a valid user name !");
                return;
            }
            let blocked = [];
            let savedblocks = absettings("blockedtags");
            if (savedblocks != null) { blocked = savedblocks; }
            if (blocked.findIndex(tagobj => tagobj.tag === tagtoblock) != -1) {
                alert("tag is already blocked!");
                return;
            }
            let blockobj = { tag: tagtoblock, count: null, timeout: Date.now() + tagblocker.timeoutlength };
            blocked.push(blockobj);
            absettings("blockedtags", true, blocked);
            let blocke = addtagblockelement(blockobj, taglist);
            tagblockdiv.childNodes[0].value = "";
            tagblockimages(tagtoblock).then(() => {
                let savedblock = absettings("blockedtags");
                let tagindex = savedblock.findIndex(tagobj => tagtoblock === tagobj.tag);
                if (tagindex != -1) {
                    blocke.firstChild.innerHTML = "name: " + tagtoblock + "&emsp;| imgs: " + savedblock[tagindex].count + " &emsp;| next update: " + ((savedblock[tagindex].timeout - Date.now()) / 60000).toFixed(2) + " mins";
                }
            });
        };
        tagblockdiv.childNodes[2].onclick = () => {
            let tocopy = absettings("blockedtags");
            navigator.clipboard.writeText(tocopy);
            alert("The tag block list \n\n " + tocopy + "\n\n has been copied to your clipboard!");
        };
        tagblockdiv.childNodes[3].onclick = () => {
            let data = (prompt("Please paste your data in:")).split(",");
            absettings("blockedtags", true, data);
            while (taglist.hasChildNodes()) {
                taglist.removeChild(taglist.firstChild);
            }
            data.forEach(block => {
                addtagblockelement(block, taglist);
            });

        };
        tagblockdiv.childNodes[4].onclick = () => {
            let data = [];
            while (taglist.hasChildNodes()) {
                taglist.removeChild(taglist.firstChild);
            }
            blockedtagtitle.innerText = "Blocked Tags (" + taglist.children.length + ")";
            absettings("blockedtags", true, data);
        };

        bdc.appendChild(document.createElement("br"));
        //max img blocks
        {
            let value = absettingsTemp.blocktagmaximgs;
            let numin = document.createElement("input");
            numin.type = "number";
            numin.value = value;
            numin.onchange = (e) => {
                if (e.target.value < 5) { e.target.value = 5; return; }
                if (e.target.value > 100) { e.target.value = 100; return; }
                absettings("blocktagmaximgs", true, e.target.value);
            };
            let label = document.createElement("label");
            label.innerText = "Tag-Block Max Images: ";
            label.classList.add("hoverpointer");
            bdc.appendChild(label);
            bdc.appendChild(numin);
            bdc.appendChild(document.createElement("br"));
        }
        //timeout 
        {
            let value = absettingsTemp.blocktagtimeout;
            let numin = document.createElement("input");
            numin.type = "number";
            numin.value = value / 60000;
            numin.placeholder = "number in minutes";
            numin.onchange = (e) => {
                if (e.target.value < .1) { e.target.value = 0.1; return; }
                if (e.target.value > 999) { e.target.value = 999; return; }
                absettings("blocktagtimeout", true, e.target.value * 60000);
                tagblocker.timeoutlength = e.target.value * 60000;
            };
            let label = document.createElement("label");
            label.innerText = "Tag-Block Timeout (minutes) : ";
            label.classList.add("hoverpointer");
            bdc.appendChild(label);
            bdc.appendChild(numin);
            bdc.appendChild(document.createElement("br"));
        }

        abpdiv.appendChild(div);
        abpdiv.appendChild(document.createElement("br"));
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
        title.innerText = "Other Settings";
        title.style.marginTop = "0px";
        card.appendChild(title);
        card.appendChild(document.createElement("hr"));

        {
            let ison = absettingsTemp.displaytopimgs;
            let check = document.createElement("input");
            check.type = "checkbox";
            check.id = "displaytopimgs-check-menu";
            check.checked = ison;
            check.addEventListener("change", (e) => {
                absettings("displaytopimgs", true, e.target.checked);
                ison = e.target.checked;
            });
            let label = document.createElement("label");
            label.innerText = "Top Images Tab";
            label.classList.add("hoverpointer");
            label.setAttribute("for", "displaytopimgs-check-menu");
            card.appendChild(label);
            card.appendChild(check);
            card.appendChild(document.createElement("br"));
        }

        {
            let ison = absettingsTemp.displaylikes;
            let check = document.createElement("input");
            check.type = "checkbox";
            check.id = "displaylikes-check-menu";
            check.checked = ison;
            check.addEventListener("change", (e) => {
                absettings("displaylikes", true, e.target.checked);
                ison = e.target.checked;
            });
            let label = document.createElement("label");
            label.innerText = "Display Likes";
            label.classList.add("hoverpointer");
            label.setAttribute("for", "displaylikes-check-menu");
            card.appendChild(label);
            card.appendChild(check);
            card.appendChild(document.createElement("br"));
        }

        {
            let ison = absettingsTemp.displayfollows;
            let check = document.createElement("input");
            check.type = "checkbox";
            check.id = "displayfollows-check-menu";
            check.checked = ison;
            check.addEventListener("change", (e) => {
                absettings("displayfollows", true, e.target.checked);
                ison = e.target.checked;
            });
            let label = document.createElement("label");
            label.innerText = "Display Follows";
            label.classList.add("hoverpointer");
            label.setAttribute("for", "displayfollows-check-menu");
            card.appendChild(label);
            card.appendChild(check);
            card.appendChild(document.createElement("br"));
        }

        {
            let ison = absettingsTemp.negativegenes;
            let check = document.createElement("input");
            check.type = "checkbox";
            check.id = "negativegenes-check-menu";
            check.checked = ison;
            check.addEventListener("change", (e) => {
                absettings("negativegenes", true, e.target.checked);
                ison = e.target.checked;
            });
            let label = document.createElement("label");
            label.innerText = "Negative Genes in Gene Creation";
            label.classList.add("hoverpointer");
            label.setAttribute("for", "negativegenes-check-menu");
            card.appendChild(label);
            card.appendChild(check);
            card.appendChild(document.createElement("br"));
        }


        let hardresetbtn = document.createElement("button");
        hardresetbtn.innerText = "Hard Reset";
        hardresetbtn.style.background = "darkred";
        hardresetbtn.addEventListener("click", () => {
            if (confirm("Do you really want to reset all settings?")) {
                localStorage.removeItem("abplus-settings");
                localStorage.removeItem("abplus-blocked");
                localStorage.removeItem("abplus-blockedimgs");
                location.reload(true);
            }
        });
        card.appendChild(hardresetbtn);
        card.appendChild(document.createElement("br"));


        let speenbtn = document.createElement("button");
        speenbtn.innerText = "Speen";
        speenbtn.addEventListener("click", () => {
            if (confirm("Do you really want to speen?")) {
                speeeen();
            }
        });
        card.appendChild(speenbtn);
        card.appendChild(document.createElement("br"));
        card.appendChild(document.createElement("hr"));

        let resetbtn = document.createElement("button");
        resetbtn.innerText = "Reset";
        resetbtn.classList.add("primary_button");
        resetbtn.addEventListener("click", () => {
            absettings("displaytopimgs", true, defaultsettings.displaytopimgs);
            absettings("displaylikes", true, defaultsettings.displaylikes);
            absettings("negativegenes", true, defaultsettings.negativegenes);
            document.getElementById("displaytopimgs-check-menu").checked = defaultsettings.displaytopimgs;
            document.getElementById("displaylikes-check-menu").checked = defaultsettings.displaylikes;
            document.getElementById("negativegenes-check-menu").checked = defaultsettings.negativegenes;
        });
        card.appendChild(resetbtn);



        abpdiv.appendChild(div);
        abpdiv.appendChild(document.createElement("br"));

    }

    // 3.25 card sliders
    {
        let div = document.createElement("div");
        div.classList.add("row");
        div.classList.add("title_row");
        let card = document.createElement("div");
        card.classList.add("row_element");
        card.classList.add("card");
        div.appendChild(card);

        let title = document.createElement("h3");
        title.innerText = "Slider Settings";
        title.style.marginTop = "0px";
        card.appendChild(title);
        card.appendChild(document.createElement("hr"));

        let select = document.createElement("select");
        select.id = "sliderform-select-menu";

        select.addEventListener("change", (e) => {
            absettings("sliderform", true, e.target.value);
            switch (e.target.value) {
                case "normal":
                    optiontext.innerText = " Ab+ makes no changes and all sliders remain as sliders.";
                    absettings("convertslider", true, false);
                    break;
                case "number":
                    optiontext.innerText = "All sliders get turned into number inputs.";
                    absettings("convertslider", true, true);
                    break;
                case "toggle":
                    optiontext.innerText = "All sliders get turned into number inputs , if you click the toggle button. You can change them back to sliders by clicking the button again.";
                    absettings("convertslider", true, false);
                    break;
            }
        });

        let options = ["normal", "number", "toggle"];
        options.forEach(e => {
            let op = document.createElement("option");
            op.value = e;
            op.innerText = e;
            select.appendChild(op);
        });
        let label = document.createElement("label");
        label.innerText = "Slider Form: ";
        label.setAttribute("for", "sliderform-select-menu");
        card.appendChild(label);
        card.appendChild(select);
        card.appendChild(document.createElement("br"));

        let optiontext = document.createElement("p");
        select.value = absettingsTemp.sliderform;
        switch (select.value) {
            case "normal":
                optiontext.innerText = " Ab+ makes no changes and all sliders remain as sliders.";
                break;
            case "number":
                optiontext.innerText = "All sliders get turned into number inputs.";
                break;
            case "toggle":
                optiontext.innerText = "All sliders get turned into number inputs , if you click the toggle button. You can change them back to sliders by clicking the button again.";
                break;
        }
        card.appendChild(optiontext);
        card.appendChild(document.createElement("br"));


        card.appendChild(document.createElement("hr"));

        let resetbtn = document.createElement("button");
        resetbtn.innerText = "Reset";
        resetbtn.classList.add("primary_button");
        resetbtn.addEventListener("click", () => {
            absettings("sliderform", true, defaultsettings.sliderform);
            document.getElementById("sliderform-select-menu").value = defaultsettings.sliderform;
        });
        card.appendChild(resetbtn);



        abpdiv.appendChild(div);
        abpdiv.appendChild(document.createElement("br"));

    }

    // 3.5th card custom css
    {
        let div = document.createElement("div");
        div.classList.add("row");
        div.classList.add("title_row");
        let card = document.createElement("div");
        card.classList.add("row_element");
        card.classList.add("card");
        div.appendChild(card);

        let title = document.createElement("h3");
        title.innerText = "Custom Css Settings";
        title.style.marginTop = "0px";
        card.appendChild(title);
        card.appendChild(document.createElement("hr"));

        let textarea = document.createElement("textarea");
        let applybtn = document.createElement("button");

        {
            let ison = absettingsTemp.customcssactive;
            let check = document.createElement("input");
            check.type = "checkbox";
            check.id = "customcss-check-menu";
            check.checked = ison;
            textarea.disabled = !ison;
            applybtn.disabled = !ison;
            if (!ison) {
                applybtn.classList.add("disabled");
            }
            check.addEventListener("change", (e) => {
                absettings("customcssactive", true, e.target.checked);
                ison = e.target.checked;
                textarea.disabled = !ison;
                applybtn.disabled = !ison;
                if (ison) {
                    applybtn.classList.remove("disabled");
                    document.getElementById("customusercssabp").innerHTML = absettings("customcss");;

                } else {
                    applybtn.classList.add("disabled");
                    document.getElementById("customusercssabp").innerHTML = "";
                }
            });
            let label = document.createElement("label");
            label.innerText = "Custom Css";
            label.classList.add("hoverpointer");
            label.setAttribute("for", "customcss-check-menu");
            card.appendChild(label);
            card.appendChild(check);
            card.appendChild(document.createElement("br"));
        }

        textarea.cols = "50";
        textarea.rows = "20";
        textarea.style.resize = "vertical";
        textarea.value = absettingsTemp.customcss;

        card.appendChild(textarea);

        applybtn.innerText = "Apply";
        applybtn.classList.add("primary_button");
        applybtn.onclick = () => {
            absettings("customcss", true, textarea.value);
            let customcss = document.getElementById("customusercssabp");
            if (customcss == null) {
                customcss = document.createElement('style');
                customcss.id = "customusercssabp";
                customcss.innerHTML = styles;
                document.body.appendChild(customcss);
            }
            customcss.innerHTML = textarea.value;
        };
        card.appendChild(applybtn);



        //         let styleElement = document.createElement('style');
        // styleElement.innerHTML = styles;
        // document.body.appendChild(styleElement);
        card.appendChild(document.createElement("hr"));
        card.appendChild(document.createElement("br"));

        abpdiv.appendChild(div);
        abpdiv.appendChild(document.createElement("br"));
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
        title.innerText = "Stats";
        title.style.marginTop = "0px";
        card.appendChild(title);
        card.appendChild(document.createElement("hr"));

        let blockam = document.createElement("p");
        blockam.innerText = "Blocked " + JSON.parse(localStorage.getItem("abplus-blockedimgs")) + " images / notifications in total.";
        card.appendChild(blockam);

        let version = document.createElement("p");
        version.innerText = "Current Version : " + document.querySelector("data#abp-version").value;
        card.appendChild(version);

        let windowId = document.createElement("p");
        windowId.innerText = "Ab+ Window Id : " + abpWinId;
        card.appendChild(windowId);

        let test = document.createElement("p");
        test.innerHTML = "Your exact location : " + "<a style='color:red' target='_blank' href='https://www.google.com/maps/@"+((Math.random()*100)-50)+","+((Math.random()*100)-50)+",200m/data=!3m1!1e3'>It's right here ! :) </a>";
        test.addEventListener("click",()=>setTimeout(()=>alert("Don't worry it's probably pointing into the sea..."),100));
        if(Math.random()>0.7)card.appendChild(test);


        card.appendChild(document.createElement("hr"));
        card.appendChild(document.createElement("br"));
        
        let resetbtn = document.createElement("button");
        resetbtn.innerText = "Reset";
        resetbtn.classList.add("primary_button");
        resetbtn.addEventListener("click", () => {
            localStorage.removeItem("abplus-blockedimgs");
            blockam.innerText = "AB+ has blocked 0 images.";
        });
        card.appendChild(resetbtn);

        abpdiv.appendChild(div);
        abpdiv.appendChild(document.createElement("br"));
    }
    // 5th card info
    {
        let div = document.createElement("div");
        div.id = "#Info";
        div.classList.add("row");
        div.classList.add("title_row");
        let card = document.createElement("div");
        card.classList.add("row_element");
        card.classList.add("card");
        div.appendChild(card);

        let title = document.createElement("h3");
        title.innerText = "Info";
        title.style.marginTop = "0px";

        let github = document.createElement("a");
        github.innerText = "github page";
        github.href = "https://github.com/jannik323/artbreederplus";

        let firefox = document.createElement("a");
        firefox.innerText = "firefox addon page";
        firefox.href = "https://addons.mozilla.org/en-US/firefox/addon/ab-plus/";

        let discord = document.createElement("a");
        discord.innerText = "Contact Info";
        discord.href = "#Info";
        discord.addEventListener("click", () => {
            alert("Discord : jannik#7401");
        });

        card.appendChild(title);
        card.appendChild(document.createElement("hr"));
        card.appendChild(github);
        card.appendChild(document.createElement("br"));
        card.appendChild(firefox);
        card.appendChild(document.createElement("br"));
        card.appendChild(discord);
        card.appendChild(document.createElement("br"));
        abpdiv.appendChild(div);
        abpdiv.appendChild(document.createElement("br"));

    }

    function addblockelement(block, list) {
        let blockeduser = document.createElement("li");
        blockeduser.classList.add("blockeduser");
        let blockname = document.createElement("span");
        blockname.innerText = block;
        blockname.onclick=()=>{
            window.open("/"+block); 
        };
        
        let removebtn = document.createElement("button");
        removebtn.innerText = "X";
        removebtn.onclick=()=>{
            let savedblock = JSON.parse(localStorage.getItem("abplus-blocked"));
            let userindex = savedblock.findIndex(user=>block===user);
            if(userindex!=-1){
                savedblock.splice(userindex,1);
            }
            localStorage.setItem("abplus-blocked",JSON.stringify(savedblock));
            blockeduser.remove();
            document.getElementById("abpblockedtitle").innerText = "Blocked Users ("+list.children.length +")";
        };
        blockeduser.appendChild(blockname);
        blockeduser.appendChild(removebtn);
        list.appendChild(blockeduser);
    }

    function addtagblockelement(block, list) {
        let blockeduser = document.createElement("li");
        blockeduser.classList.add("blockeduser");
        let blockname = document.createElement("span");
        blockname.innerHTML = "name: "+block.tag+ "&emsp;| imgs: "+ block.count +" &emsp;| next update: "+ ((block.timeout-Date.now())/60000).toFixed(2)+ " mins";
        blockname.onclick=()=>{
            tagblockimages(block.tag).then(()=>{
                let savedblock=absettings("blockedtags");
                let tagindex = savedblock.findIndex(tagobj=>block.tag===tagobj.tag);
                if(tagindex!=-1){
                    savedblock[tagindex].timeout=Date.now()+tagblocker.timeoutlength;
                    absettings("blockedtags",true,savedblock);
                    blockname.innerHTML = "name: "+block.tag+ "&emsp;| imgs: "+ savedblock[tagindex].count +" &emsp;| next update: "+ ((savedblock[tagindex].timeout-Date.now())/60000).toFixed(2)+ " mins";
                } 
            });
             
        }

        let removebtn = document.createElement("button");
        removebtn.innerText = "X";

        removebtn.onclick=()=>{
            let savedblock=absettings("blockedtags");
            let tagindex = savedblock.findIndex(tagobj=>block.tag===tagobj.tag);
            if(tagindex!=-1){
                savedblock.splice(tagindex,1);
            }
            absettings("blockedtags",true,savedblock);
            tagblocker.currentblocks=savedblock;
            let tagimgblocks = JSON.parse(localStorage.getItem("abplus-blocked-tag-img"));
            let tagindex2 = tagimgblocks.findIndex(e=>block.tag===e.tag);
            if(tagindex2!=-1){
                tagimgblocks.splice(tagindex2,1);
            }
            localStorage.setItem("abplus-blocked-tag-img",JSON.stringify(tagimgblocks));
            
            blockeduser.remove();
            document.getElementById("abpblockedtagtitle").innerText = "Blocked Tag ("+list.children.length +")";
        };
        
        blockeduser.appendChild(blockname);
        blockeduser.appendChild(removebtn);
        list.appendChild(blockeduser);

        return blockeduser;
    }
}

// starttttttt yeee here and away we goo
start();

// })();