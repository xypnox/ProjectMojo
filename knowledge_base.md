# Knowledgebase

### **How to add Google Analytics and track page view from react-router?**

```tsx
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import ReactGA from "react-ga";

const usePageTracking = () => {
  const location = useLocation();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!window.location.href.includes("localhost")) {
      ReactGA.initialize("UA-000000000-0");
    }
    setInitialized(true);
  }, []);

  useEffect(() => {
    if (initialized) {
      ReactGA.pageview(location.pathname + location.search);
    }
  }, [initialized, location]);
};

export default usePageTracking;
```

And use the page tracking in a component that is global and is inside the Router element as Router provides the context for location. Therefore we put it in a component such as Navbar.

```tsx
const NavBar = () => {
  usePageTracking();

  return (...);
};
```

Ref: https://stackoverflow.com/a/63249329/

### **How to load PNG data via axios?**

Axios by default processes a request in utf-8 encoding. This is fine for text and JSON but if the data of the request is binary, say for example, image, then it will not be processed correctly. To get the raw data, you need to set the `responseType` config to `arraybuffer`.

Eg:

```js
axios.get('https://www.example.com', {
  responseType: 'arraybuffer'
});
```

Ref: https://stackoverflow.com/questions/40211246/encoding-issue-with-axios



### **How to check if JWT has expired and redirect user to login in react?**

Libraries such as `jwt-decode` allow you to decode the token from which you can get the expiry time, you can then compare it to the current time and see if it has expired. 

In the case of project mojo, since auth is wrapped completely in useAuth hook, the redirection is done automatically when the user is removed from the localstorage, thus whenever the token is found to have expired, the user is removed and the route detects the change in user and redirects to login.

Ref:https://stackoverflow.com/questions/46418975/react-how-to-check-if-jwt-is-valid-before-sending-a-post-request



### **How to load image in img tag that requires auth headers?**

First fetch the image data via axios.

Then convert the data to base64 and replace the src value with the base64 encoded image.

Example component that does this:

```tsx
export default function Image(props: { src: string; alt: string }) {
  let [imgData, setImgData] = useState("");
  const auth = useAuth();

  useEffect(() => {
    axios
      .get(props.src, auth?.authHeader())
      .then((resp) => {
        const data = `data:${resp.headers["content-type"]};base64,${new Buffer(
          resp.data
        ).toString("base64")}`;
        setImgData(data);
      })
      .catch((e) => {
        console.log(e);
      });
  });

  return <img src={imgData} alt={props.alt} />;
}
```

Ref: https://stackoverflow.com/questions/52915486/load-image-from-server-that-requires-sending-headers



### How to create a zip with multiple files that are fetched one after the other via axios?

This assumes usage of [`jszip`](https://stuk.github.io/jszip/). We will create a zip and then after processing allow users to download it. For download we need: [`filesaver`](https://github.com/eligrey/FileSaver.js/).

A simple synchronous way if you have all the files at clientside is:

```js
zip.file("file1.png", file1Data);
zip.file("file2.png", file2Data);
zip.file("file3.png", file3Data);
//...

zip.generateAsync({type:"blob"})
.then(function(content) {
    // see FileSaver.js
    saveAs(content, "myZip.zip");
});
```

This works because predictably all files are added to the zip one after the other synchronously.

However, even though `map` is synchronous, an asynchronous function running inside `map` will affect the order in which the functions finish, for example:

```js
[1, 2, 3].forEach(
  function(item, index) {
     // async function, may take however much time
     asyncFunction(item, function itemDone() {
       console.log(item + " done");
     });
  }
);

console.log("OK");

/* Possible Output

3 done
OK
1 done
2 done

*/
```

If `asyncFunction` wasn't asynchronous, you can reliably say that OK would be logged after each of the `forEach` has completed.

In our case we fetch the files via axios, which is async. And after all files have been added we need to run the `zip.generateAsync()`. 

There are several ways of doing it, one of them is to use `Promise.all()` for example:

```js
let requests = [1,2,3].map((item) => {
    return new Promise((resolve) => {
      asyncFunction(item, resolve);
    });
})

Promise.all(requests).then(() => console.log('done'));
```

But the simplest solution is to keep track of each processed request in a variable and then increment it when a request completes. Then if all requests complete, run the code you want. For more complicated async processes, `Promise.all()` is still the recommended way.

```tsx
let processed = 0; // stores number of urls processed

let zip = new JSZip();

array.forEach((url) => {
    axios.get(url).then((resp) => {
        zip.file(genFileName(url), resp.data);
        
        processed++;
        
        if (processed === array.length) {
            zip.generateAsync({ type: "blob" }).then(function (content) {
                saveAs(content, "myzip.zip");
            });
        }
    });
});
```

For more control and repeated use, libraries such as [async](https://caolan.github.io/async/v3/) can also be used.

Ref: https://stackoverflow.com/questions/18983138/callback-after-all-asynchronous-foreach-callbacks-are-completed