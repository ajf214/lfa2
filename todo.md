* Change the primary key of the StoreItems table to be a hashed value of some kind (or whatever is typical). Currently it is the name of the item, so duplicate item names are not allowed.
* Nicer loading screens for the following views:
  - when a new page of items is loaded (in the user facing part of the site AND in the admin views)
  - when a new StoreItem is getting created
* Change SQLDB auth - Ideally to use Azure RBAC and/or Managed Identity**
* Images are all too expensive to load - improve image load performance by taking advantage of Cloudinary's APIs for loading thumbnails, etc.
* Build some basic tests**
* Make the Bicep code safer


**Plan for this item lives in `/plans` directory