<template>
  <div class="about">
    <h2>
      Lawrence Farms Antiques & Interiors sells fine furniture and decorative
      arts, with a specialty in French Provencal pieces, dating from the late
      18th through early 20th centuries.
    </h2>
    <p>
      Our inventory includes a range of ceramics featuring French faience
      pottery, majolica and fine porcelains as well as mirrors, fine art,
      lithographs, lamps, garden ornaments and unique folk art pieces from
      Europe, England and America.
    </p>

    <p>
      Lawrence Farms Antiques & Interiors has been in business since 2001 with
      prior retail locations in New Canaan, Connecticut.
    </p>

    <p>
      Lawrence Farms Antiques & Interiors participates yearly in the
      <a href="http://easthamptonhistory.org/events.php" target="_blank"
        >East Hampton Antiques Show</a
      >
      benefiting the East Hampton Historical Society which takes place in July
      at Mulford Farms.
    </p>

    <p>
      <img class="image" src="../assets/headshot.jpg" /> Jill Frankel continues
      to be an active antiques dealer in the New York metropolitan area. She has
      a strong knowledge of the current market and resources, having achieved
      her Certificate in Appraisal of Fine and Decorative Arts from New York
      University. Jill graduated from Barnard College of Columbia University
      with a Bachelor of Art History and Architecture.
    </p>

    <p>
      Jill is available, by appointment, to work with individual customers to
      source specific pieces for the home or office and may be reached by email
      at
      <a href="mailto:jill@lawrencefarmsantiques.com">
        jill@lawrencefarmsantiques.com
      </a>
      or by phone at 914.666.7176
    </p>
  </div>
</template>

<style scoped>
.about {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
}

h2 {
  grid-column: 1/-1;
  margin: 50px auto 15px auto;
  font-family: "Open Sans", sans-serif;
  font-weight: 200;
  color: rgba(161, 91, 73, 1);
  max-width: 792px;
  line-height: 140%;
  padding: 0 15px;
}

p {
  grid-column: 1/-1;
  margin: 50px 0px 15px 0px;
  font-size: 18px;
  margin: 10px auto;
  padding: 0 15px;
  max-width: 624px;
  font-weight: 300;
  line-height: 130%;
}

.image {
  grid-column: 1/-1;
  display: block;
  width: 90%;
  margin: auto;
  margin-bottom: 20px;
}

a {
  text-decoration: none;
  color: var(--primary-brown);
}

/** medium */
@media screen and (min-width: 768px) {
  .image {
    margin: 0px 15px 0px 0px;
    float: left;
    width: 50%;
    display: block;
  }
}
</style>
