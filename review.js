const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
let workout;

class Workout {
  id = Date.now();
  date = new Date();
  constructor(distance, duration, coords) {
    this.distance = distance;
    this.duration = duration;
    this.coords = coords;
  }

  _setDescription() {
    // prettier-ignore
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];

    this.description = `${this.name[0].toUpperCase()}${this.name.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}

class Cycling extends Workout {
  name = 'cycling';
  constructor(distance, duration, coords, elevationGain) {
    super(distance, duration, coords);
    this.elevationGain = elevationGain;
    this._speed();
    this._setDescription();
  }
  _speed() {
    this.speed = this.distance / this.duration;
    return this;
  }
}

class Running extends Workout {
  name = 'running';
  constructor(distance, duration, coords, cadence) {
    super(distance, duration, coords);
    this.cadence = cadence;
    this._pace();
    this._setDescription();
  }
  _pace() {
    this.pace = this.duration / this.distance;
    return this;
  }
}

class App {
  #map;
  workout;
  #mapEvent;
  #workouts = [];
  #mapZoomlevel = 14;

  constructor() {
    //local data from local storage
    this._getLocalStorage();
    this._getPosition();

    //form click event
    form.addEventListener('submit', this._newworkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
  }

  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('Couldnt get Your Current location');
        }
      );
  }

  _loadMap(position) {
    const { latitude, longitude } = position.coords;
    const coord = [latitude, longitude];

    this.#map = L.map('map').setView(coord, 13);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on('click', this._showForm.bind(this));

    this.#workouts.forEach(work => this._renderWorkoutMarker(work));
  }

  _showForm(event) {
    this.#mapEvent = event;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _newworkout(e) {
    e.preventDefault();

    const numberValidator = (...numbers) =>
      numbers.every(num => Number.isFinite(num));

    const positiveNum = (...numbers) => numbers.every(num => num > 0);

    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const type = inputType.value;
    const { lat, lng } = this.#mapEvent.latlng;
    const coords = [lat, lng];

    if (type === 'running') {
      const cadence = +inputCadence.value;

      if (
        !numberValidator(distance, duration, cadence) ||
        !positiveNum(distance, duration, cadence)
      )
        return console.log('number must positive');

      workout = new Running(distance, duration, coords, cadence);
    }

    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      if (
        !numberValidator(distance, duration, elevation) ||
        !positiveNum(distance, duration)
      )
        return console.log('number must positive');
      workout = new Cycling(distance, duration, coords, elevation);
    }

    //pusing new workout to the workouts
    this.#workouts.push(workout);
    //rendering Marker
    this._renderWorkoutMarker(workout);
    //hide form
    this._hideForm();
    //rendering workout
    this._renderWorkout(workout);
    //updating local storage
    this._setLocalStorage();
  }

  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.name}-popup`,
        })
      )
      .setPopupContent(
        `${workout.name === 'running' ? '🏃‍♀️' : '🚴‍♂️'} ${workout.description}`
      )
      .openPopup();
  }

  _toggleElevationField() {
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  }
  _hideForm() {
    form.classList.add('hidden');
    inputCadence.value =
      inputElevation.value =
      inputDuration.value =
      inputDistance.value =
        '';
    form.style.display = 'none';
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  _renderWorkout(workout) {
    let html = `
      <li class="workout workout--${workout.name}" data-id="${workout.id}">
        <h2 class="workout__title">${workout.description}</h2>
        <div class="workout__details">
          <span class="workout__icon">${
            workout.name === 'running' ? '🏃‍♀️' : '🚴‍♀️'
          }</span>
          <span class="workout__value">${workout.distance}</span>
          <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⏱</span>
          <span class="workout__value">${workout.duration}</span>
          <span class="workout__unit">min</span>
        </div>
    `;

    if (workout.name === 'cycling') {
      html += `
        <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.elevation}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${Math.trunc(workout.speed)}</span>
            <span class="workout__unit">m</span>
          </div>
        </li>
      `;
    }

    if (workout.name === 'running') {
      html += `
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${Math.round(workout.pace)}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>
      `;
    }

    form.insertAdjacentHTML('afterend', html);
  }

  _moveToPopup(e) {
    const workEl = e.target.closest('.workout');
    if (!workEl) return;

    const workout = this.#workouts.find(
      workout => workout.id === +workEl.dataset.id
    );
    this.#map.setView(workout.coords, this.#mapZoomlevel, {
      animate: true,
      pan: {
        duration: 2,
      },
    });
  }

  _setLocalStorage() {
    localStorage.setItem('workoutData', JSON.stringify(this.#workouts));
  }

  _getLocalStorage() {
    const workouts = JSON.parse(localStorage.getItem('workoutData'));

    if (!workouts) return;

    this.#workouts = workouts;
    this.#workouts.forEach(work => {
      this._renderWorkout(work);
    });
  }
  resetLocalStorage() {
    localStorage.removeItem('workoutData');
    location.reload();
  }
}

const app = new App();

document
  .querySelector('#btn__loacalStorage')
  .addEventListener('click', app.resetLocalStorage);
