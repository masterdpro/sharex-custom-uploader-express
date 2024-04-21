# How to use it
If you have any issues, you can join my discord and ask for help https://discord.gg/bfS3yuCB8Z

## Code side
Firstly, clone the repository
```
git clone https://github.com/masterdpro/sharex-custom-uploader-express
cd sharex-custom-uploader-express/
```
After, download the packages.
```
npm i
```
Open up ImageApi.js, change the **secret_key** and **domain_url** variables for whatever you want to use.
*You can also change **lenghtofstring** for a bigger or tinner chain*

![Code_Yi40lON411](https://discords.ca/api/image/mcmo24v.png)

And then the code should be ready to run !
```
node .
```

## ShareX side

1. Open ShareX (I know, weird step)
2. Click on **Destionations** and then **Custom uploader settings**

![sharex](https://discords.ca/api/image/s7lv0u8.png)

3. In the left upper corner, click on **New**

![sharexnew](https://discords.ca/api/image/m2lyny1.png)

4. Change the name for whatever you want, it doesn't matter, set destination type to **image uploader**
5. Set the method to **post** and inster the Url to your API (the one that we made earlier). and add /upload at the end
6. In the body part, add a data called **secret**, with the value of your choice, need to be the same as the one you put in the code, in our case **YourSecretKey**
7. Finally, For the **File form name**, put **sharex**.

It should look like this...

![sharexconfig](https://discords.ca/api/image/nluuura.png)

You can test it by clicking on the test button in the left down corner.




