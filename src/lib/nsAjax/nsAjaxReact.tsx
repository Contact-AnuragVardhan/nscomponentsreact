const nsCompAjax = require('./generated/js/nsAjax.min.js');
const NSAjax = nsCompAjax.NSAjax;

export class NSAjaxReact 
{
    private ajax: ReturnType<typeof NSAjax> = null;     
    
    constructor(defaultSetting?: any) 
    {
        this.ajax = new NSAjax(defaultSetting);
        this.post = this.post.bind(this);
        this.get = this.get.bind(this);
        this.jsonp = this.jsonp.bind(this);
    }

    post(url,data,setting) 
    {
       return this.ajax.post(url,data,setting);
    }
    
    get(url,data,setting) 
    {
       return this.ajax.get(url,data,setting);
    }
    
    delete(url,data,setting) 
    {
       return this.ajax.delete(url,data,setting);
    }
    
    head(url,data,setting) 
    {
       return this.ajax.head(url,data,setting);
    }
    
    options(url,data,setting) 
    {
       return this.ajax.options(url,data,setting);
    }
    
    put(url,data,setting) 
    {
       return this.ajax.put(url,data,setting);
    }
    
    jsonp(url,data,setting) 
    {
       return this.ajax.jsonp(url,data,setting);
    }
};
