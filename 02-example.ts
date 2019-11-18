import {Observable} from "rxjs";

const wait = async (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Observable that emits a random number every second
const myObservable = new Observable<number>(subscriber => {
  console.log('subscribing');

  let running = true;

  const fn = async (): Promise<void> => {
    while(running) {
      subscriber.next(Math.random());
      await wait(1000);
    }
  };
  fn();

  return () => {
    console.log('unsubscribe');
    running = false;
  }
});

const subscription = myObservable.subscribe({
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

// Unsubscribe after 5 seconds
setTimeout(() => {
  subscription.unsubscribe();
}, 5000);