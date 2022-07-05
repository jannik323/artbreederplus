function injectScript(file, node) {
    var th = document.getElementsByTagName(node)[0];
    var s = document.createElement("script");
    s.setAttribute("type", "text/javascript");
    s.setAttribute("src", file);
    s.setAttribute("id","abp-script");
    th.appendChild(s);
}
if(document.querySelector("#abp-script")==null){

    let data =document.createElement("data");
    data.value=browser.runtime.getManifest().version;
    data.id="abp-version";
    document.head.appendChild(data);

    injectScript( browser.runtime.getURL("js/abplus.js"), "head");
}else{
    if(confirm("AB+ has been reloaded. You might have to reload the page to make changes effective !")){
        location.reload();
    }
}