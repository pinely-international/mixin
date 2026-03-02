# class-mixin-instance

## Example

```ts
class Person {
  name!: string
  age!: number

  private gender!: "aircraft"
}

class Profile {
  name!: string
  avatar!: string

  protected something!: {}
}

export class User extends mixin(Person, Profile) {
  id!: number

  asd() {
    this.gender // => Error: Property is private
    this.something
  }
}


const user = new User
user.gender // => Error: Property is private
user.something // => Error: Property is protected

user instanceof User // === true
user instanceof Person // === true
user instanceof Profile // === true
user instanceof mixin(Person, Profile) // === true
```

## Example Notes

- a mixin class can define public/protected/private property visibility.
- a mixin class can't define a constructor
- mixin classes must match or error will be shown at `mixin(Person, Profile)`.
- a class that extends a mixin can be checked with `instanceof` for each class and altogether.

### Type per class

When inspecting a property from a mixin, your IDE will display what this type belongs to.
<img width="612" height="194" alt="image" src="https://github.com/user-attachments/assets/b2b3a4bc-58ff-44fb-a4c7-6cf4433686ab" />


### Type `super`

When inspecting `super`, your IDE will display the mixins.
<img width="618" height="182" alt="image" src="https://github.com/user-attachments/assets/334b31fc-00e5-4fdd-b255-4fcd0390abbc" />
