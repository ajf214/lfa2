# Lawrence Farms Antiques 2

## To run locally without building
1. Start frontend with `npm run serve`
1. Start backend with `npm run dev`

NOTE: Ensure your IP address is in the allow list for the SQL server.

## To build and run locally

1. Run `npm install`
1. Acquire secrets for: Azure SQL DB, Cloudinary Image CDN (currently in Key Vault)
1. Add secrets to docker-compose.yaml
1. Run `docker-compose build`
1. Run `docker-compose up`

NOTE: Remember to be sign in with your *@lawrencefarmsantiques.com account! This is used for both accessing the admin page of the running site, but also managing the backing services.

## Build production artifacts
TODO

## Deploy to Azure

Login to ACR:
```powershell
docker login <registry>.azurecr.io
```

Tag and push images
```powershell
docker tag lfa-front:<tag> <registryurl>.azurecr.io/lfa/lfa-front:<tag>
docker tag lfa-back:<tag> <registryurl>.azurecr.io/lfa/lfa-back:<tag>

docker push <registryurl>.azurecr.io/lfa/lfa-front:<tag>
docker push <registryurl>.azurecr.io/lfa/lfa-back:<tag>
```

1. Deploy `kubeEnvironment` + two `containerApps` which reference images in ACR

```powershell
az deployment sub create -f ./deploy/main.bicep -l <location>
```

NOTE: Remember to be sign in with your *@lawrencefarmsantiques.com account! This is used for both accessing the admin page of the running site, but also managing the backing services.
