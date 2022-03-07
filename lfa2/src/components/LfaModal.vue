<template>
  <div class="background-shade">
    <div class="modal-container">
      <p>{{ infoMessage }}</p>
      <div class="actions">
        <button class="confirm" @click="confirm">{{ confirmationText }}</button>
        <button @click="discard">{{ discardText }}</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "LfaModal",
  props: ["infoMessage", "confirmationText", "discardText"],
  data() {
    return {};
  },
  methods: {
    confirm() {
        this.$emit('confirm')
    },
    discard() {
        this.$emit('discard')
    },
  },
};
</script>

<style scoped>
.background-shade {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(20,20,20, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-container {
  width: 90%;
  background-color: white;
  display: flex;
  flex-direction: column;
  flex-basis: content;
  padding: 20px;
}

.modal-container p {
    margin: 0 0;
    margin-bottom: 20px;
}

.actions {
  display: flex;
  flex-direction: row;
  margin-top: 20px;
}

.actions button {
  margin-right: 8px;
  padding: 8px;
}

.confirm {
  background-color: var(--sold-red);
  border-color: var(--sold-red);
  color: white;
}

.confirm:hover {
  border-color: var(--subtle-sold-red);
  background-color: var(--subtle-sold-red);
}

@media screen and (min-width: 768px) {
  .modal-container {
    max-width: 500px;
  }
}
</style>
