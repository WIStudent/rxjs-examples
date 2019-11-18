import {from} from 'rxjs';

// Observable that emits 1 to 3
const observable = from([1,2,3]);

const subscription = observable.subscribe({
  next(value) {
    console.log(value);
  },
  complete() {
    console.log('complete')
  },
  error(e) {
    console.log(e)
  }
});
