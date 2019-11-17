import {Observable} from 'rxjs';
import {tap, filter, map, share, take} from 'rxjs/operators'

// Helper function to wait for next key press
const waitForAnyKey = async () => {
  console.log('press any key...');
  process.stdin.setRawMode(true)
  return new Promise(resolve => {
    process.stdin.resume();
    process.stdin.once('data', () => {
      process.stdin.setRawMode(false)
      process.stdin.pause();
      resolve()
    });
  });
};

// Mock MessageClient
type Callback = (value: string) => void
class MockMessageClient {
  
  private static MESSAGES: ReadonlyArray<string> = [
    '{',
    JSON.stringify({type: 'number', data: 42}),
    JSON.stringify({type: 'string', data: 'six times nine'}),
    JSON.stringify({})
  ]

  private callbackFn: Callback | null = null;

  public constructor(callbackFn: Callback) {
    console.log('Starting message client');
    this.callbackFn = callbackFn;
    this.sendMessages();
  }


  private async sendMessages () {
    while (this.callbackFn !== null) {
      const random = Math.floor(Math.random() * MockMessageClient.MESSAGES.length);
      this.callbackFn(MockMessageClient.MESSAGES[random]);
      await waitForAnyKey();
    }
  }

  public stop () {
    console.log('stopping message client');
    this.callbackFn = null;
  }
}

// MessageClient observable
const clientObservable = new Observable<string>(subscriber => {
  const client = new MockMessageClient((value) => subscriber.next(value));
  return () => client.stop();
}).pipe(
  tap(() => console.log('\n')),
  tap(value => console.log(`clientObservable: ${value}`))
);

// Filter invalid json messages
const isValidJson = (value: string): boolean => {
  try{
    JSON.parse(value);
    return true;
  } catch {
    return false
  }
}

const validJsonObservable = clientObservable.pipe(
  filter(isValidJson),
  tap(value => console.log(`validJsonObservable: ${value}`))
);

// Parse json
const parsedJsonObservable = validJsonObservable.pipe(
  map(value => JSON.parse(value)),
  tap(value => console.log(`parsedJsonObservable: ${JSON.stringify(value)}`))
);

// Filter messages that does not conform to message format
interface Message {
  type: string;
  data?: any;
}

const isMessage = (value: any): value is Message =>
typeof value === 'object' && value && typeof value.type === 'string';

const validMessageObservable = parsedJsonObservable.pipe(
  filter(isMessage),
  tap(value => console.log(`validMessageObservable: ${JSON.stringify(value)}`))
);

/* Shareable observable: 
 * " As long as there is at least one Subscriber this Observable will be subscribed and emitting data. 
 * When all subscribers have unsubscribed it will unsubscribe from the source Observable."
 * https://rxjs-dev.firebaseapp.com/api/operators/share
 */
const sharedObservable = validMessageObservable.pipe(share());

// Observable emitting type: string messages
interface StringMessage extends Message {
  data: string;
}
const isStringMessage = (message: Message): message is StringMessage =>
  typeof message.data === 'string';

const typeStringObservable = sharedObservable.pipe(
  filter(isStringMessage)
);

// Observable emitting type: number messages
interface NumberMessage extends Message {
  data: number
}
const isNumberMessage = (message: Message): message is NumberMessage =>
  typeof message.data === 'number';

const typeNumberObservable = sharedObservable.pipe(
  filter(isNumberMessage)
);

// Observable that emits first two messages of type string
const first2StringsObservable = typeStringObservable.pipe(
  take(2)
);

// Observable that emits first three messages of type number
const first3NumbersObservable = typeNumberObservable.pipe(
  take(3)
);

// Subscribe to observables
first2StringsObservable.subscribe({
  next(message) {
    console.log(`string observer: ${message.data}`)
  },
  complete() {
    console.log('string observer complete')
  }
});

first3NumbersObservable.subscribe({
  next(message) {
    console.log(`number observer: ${message.data}`)
  },
  complete() {
    console.log('number observer complete')
  }
});
