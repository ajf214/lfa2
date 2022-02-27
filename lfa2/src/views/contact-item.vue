<template>
  <div class="contact">
    <div class="copy">
      <p>
        Jill is available, by appointment, to work with individual customers to
        source specific pieces for the home or office and may be reached at:
      </p>
    </div>

    <div class="major">
      <div class="contact-type">
        <h2 class="type-name">Phone:</h2>
        <h2>914.666.7176</h2>
      </div>

      <div class="contact-type">
        <h2 class="type-name">Email:</h2>
        <h2>jill@lawrencefarmsantiques.com</h2>
      </div>

      <div class="contact-type">
        <h2 class="type-name">Address:</h2>
        <h2>PO Box 493</h2>
      </div>

      <div class="contact-type last-line">
        <h2 class="type-name"></h2>
        <h2>Chappaqua, NY 10514</h2>
      </div>
    </div>
  </div>
</template>
<style scoped>
.contact {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
}
.copy {
  grid-column: 1/-1;
  margin: 0px auto;
  font-size: 18px;
  font-weight: 300;
  line-height: 130%;
  text-align: left;
  width: 85%;
  max-width: 500px;
}
h2 {
  margin: 0px 0px 0px 0px;
  font-family: "Open Sans", sans-serif;
  font-weight: 200;
  color: rgba(161, 91, 73, 1);
  text-align: left;
  display: inline-block;
}
.copytitles {
  grid-column: 5/6;
  margin: 50px 0px 15px 0px;
  font-family: "Open Sans", sans-serif;
  font-weight: 200;
  color: rgba(161, 91, 73, 1);
  text-align: right;
}

a {
  text-decoration: none;
  color: rgba(161, 91, 73, 1);
}
.major {
  grid-column: 1/-1;
  width: max-content;
  margin: auto;

  font-size: 14px;
}
.contact-type {
  margin: 25px 0px;
  grid-column: 5/9;

  display: flex;
  flex-direction: column;
}

.type-name {
  width: 120px;
  text-align: left;
  color: black;
  margin: 8px 0;
}

.last-line {
  margin: -32px 0px 0px 0px;
}

@media screen and (min-width: 768px) {
  .contact-type {
    flex-direction: row;
  }

  .copy {
    grid-column: 3/-3;
    max-width: 600px;
  }

  .major {
    grid-column: 4/-4;
    font-size: initial;
  }
}
</style>
