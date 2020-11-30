(function () {
    var loader=new PIXI.loaders.Loader(),
        fileAry = [
            {name:'material',src:'images/tea.json'}
        ],
        teaMaterialTT = null;//资源

    $(document).ready(function () {
        var isFirst = true;

        //预加载资源
        loader=  preLoadFile(fileAry,function () {
            teaMaterialTT = loader.resources.material.textures;

            //开始创建迷宫
            if(isFirst){
                isFirst  = false;
                gameFn(teaMaterialTT);
            }else{
                gameFnMain();
            }
        });

    });

    //预加载资源
    function preLoadFile(ary,fn){
        var files = [],fileAllUrl=[],loader;
        if(ary&&typeof ary == 'object' && ary.constructor == Array){
            files=ary;
        }
        if(!(fn&&fn.constructor==Function)) {alert('请传入一个函数'); return;}
        fileAllUrl=document.querySelectorAll('img');
        for(var i= 0,len=fileAllUrl.length;i<len;i++){
            if(!fileAllUrl[i].src) return;
            var name='file_'+i;
            files.push({name:name,src:fileAllUrl[i].src});
        }
        if(ary.length<=0&&files.length<=0){document.querySelector('#loading').style.display='none';fn();return;}
        if(!isInclude('pixi.min.js')) return;
        loader=new PIXI.loaders.Loader();
        files.forEach(function(item,index){
            loader.add(item.name,item.src);
        });


        var startPro = 1,stepPro = 100/8;
        loader.on("progress",function(e,r){
            if(Math.round(e.progress)>=startPro*stepPro&&Math.round(e.progress)<(startPro+1)*stepPro){
                $("#loading .load-img").hide();
                $("#loading .load-img"+startPro).show();
                startPro++;
            }
            document.querySelector('.load-num').innerHTML= Math.round(e.progress)+"%";
            if( Math.round(e.progress)>=100){
                document.querySelector('.load-num').innerHTML= "100%";
                setTimeout(function () {
                    document.querySelector('#loading').style.display='none';
                },50);
            }
        });
        loader.once('error',function(e,r){console.log('缺少资源');fn();});
        loader.once('complete', function(e,r) {fn();});
        loader.load();              //开始加载
        return loader;
    }
    //todo:判断是否引入某个库
    function isInclude(name){
        var js= /js$/i.test(name);
        var es=document.getElementsByTagName(js?'script':'link');
        for(var i=0;i<es.length;i++)
            if(es[i][js?'src':'href'].indexOf(name)!=-1) return true;
        return false;
    }
})();