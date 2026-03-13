import { Option, Result, Serializer } from "@swan-io/boxed";

export type PrefilleldParams = {
  vatNumber: boolean;
  registrationNumber: boolean;
  registrationDate: boolean;
};

const createSessionStorage = <T>(name: string) => {
  const set = (value: T) => {
    Result.fromExecution(() => Serializer.encode(value)).tapOk(json =>
      window.sessionStorage.setItem(name, json),
    );
  };

  const update = (updater: (value: Option<T>) => T) => {
    set(updater(get()));
  };

  const get = () =>
    Option.fromNullable(window.sessionStorage.getItem(name)).flatMap(value =>
      Result.fromExecution(() => Serializer.decode(value) as T).toOption(),
    );

  const delete_ = () => {
    window.sessionStorage.removeItem(name);
  };

  return { set, update, get, delete: delete_ };
};

export const hasOnboardingPrefilled = createSessionStorage<PrefilleldParams>("Onboarding");
