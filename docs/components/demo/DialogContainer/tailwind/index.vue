<script setup lang="ts">
import { Icon } from '@iconify/vue'
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
  ScrollAreaRoot,
  ScrollAreaScrollbar,
  ScrollAreaThumb,
  ScrollAreaViewport,
  Separator,
  SwitchRoot,
  SwitchThumb,
} from 'reka-ui'
import { ref, useTemplateRef } from 'vue'

const container1 = useTemplateRef('container1')
const containerScroll1 = useTemplateRef('containerScroll1')
const isModal1 = ref(true)

const container2 = useTemplateRef('container2')
const containerScroll2 = useTemplateRef('containerScroll2')
const isModal2 = ref(true)
</script>

<template>
  <div class="flex flex-col w-full gap-2">
    <div class="flex flex-row justify-between">
      <h1 class="text-white text-lg font-semibold">
        Native Scroll
      </h1>
      <div class="flex gap-2 items-center">
        <label
          class="text-stone-700 dark:text-white text-sm leading-none pr-2 select-none"
          for="airplane-mode"
        >
          Modal
        </label>

        <SwitchRoot
          v-model="isModal1"
          class="w-[32px] h-[20px] shadow-sm flex data-[state=unchecked]:bg-stone-300 data-[state=checked]:bg-stone-800 dark:data-[state=unchecked]:bg-stone-800 dark:data-[state=checked]:bg-stone-700 border border-stone-300 data-[state=checked]:border-stone-700  dark:border-stone-700 rounded-full relative transition-[background] focus-within:outline-none focus-within:shadow-[0_0_0_1px] focus-within:border-stone-800 focus-within:shadow-stone-800"
        >
          <SwitchThumb
            class="w-3.5 h-3.5 my-auto bg-white text-xs flex items-center justify-center shadow-xl rounded-full transition-transform translate-x-0.5 will-change-transform data-[state=checked]:translate-x-full"
          />
        </SwitchRoot>
      </div>
    </div>
    <div
      ref="container1"
      class="relative rounded-xl h-[300px] w-full shadow-sm overflow-hidden border bg-mauve2 text-mauve11 "
    >
      <div
        ref="containerScroll1"
        class="overflow-auto w-full h-full p-5 text-sm leading-[1.5]"
      >
        <p>
          Lorem, ipsum dolor sit amet consectetur adipisicing elit. Accusamus nisi cum, repudiandae voluptas ullam
          error.
          Quisquam neque ratione, consectetur distinctio sequi tenetur tempora in cum iure fugit! Tempora, praesentium
          dolor.
        </p>
        <p>
          Saepe, commodi aperiam similique dolor perferendis impedit distinctio esse nostrum odit, aspernatur qui
          maiores
          repudiandae perspiciatis facere corporis! Natus vel sed repellat eveniet veniam in facilis perferendis ipsam
          nobis dicta.
        </p>
        <p>
          Consequatur numquam veritatis odit neque repellendus dignissimos nihil nemo. Sapiente non consequatur fugiat
          ea
          doloremque accusantium, in qui quisquam quod! Expedita aperiam nemo exercitationem iste nesciunt alias
          voluptatum et dolore.
        </p>
        <p>
          Nam beatae commodi et, sapiente, iusto dolor numquam delectus officiis ab aliquam dolorem debitis labore
          exercitationem natus totam at? Ut recusandae architecto quis nulla distinctio nihil, culpa dolor quo. Nisi!
        </p>
        <p>
          Numquam tempore consequuntur laboriosam est dolorum, dolores unde dolor sint, molestiae reiciendis doloribus,
          architecto ducimus eius culpa aspernatur neque eos. Perspiciatis eum architecto laudantium? Quae iusto porro
          ut.
          Enim, accusantium.
        </p>
        <p>
          Vero necessitatibus nesciunt earum deserunt voluptas cupiditate! Fugiat hic quaerat optio iste nulla nostrum
          eius nesciunt atque obcaecati natus aut expedita autem nemo recusandae sed, corrupti laudantium quas
          dignissimos
          veniam.
        </p>
        <p>
          Adipisci fugiat, nisi dolore, fugit quaerat quis cum minus vel incidunt temporibus enim voluptatibus esse
          commodi veritatis laborum quibusdam aut illo, voluptatum culpa dolores vero. Animi explicabo nostrum eius a.
        </p>
        <p>
          Ipsam debitis ad rem accusantium, molestias optio fugit tempore sit obcaecati a magnam quisquam
          exercitationem,
          culpa quasi dolor aut quis aspernatur qui sint. Aspernatur, enim non quisquam cumque expedita dolorem.
        </p>
        <p>
          Eligendi molestiae omnis dolorem repellendus ipsa consequatur dolore porro eum neque, rem similique corrupti
          illum veniam earum quis animi quisquam blanditiis fuga tenetur odio architecto libero. Asperiores doloribus
          ipsum id.
        </p>
      </div>
    </div>

    <DialogRoot
      :modal="isModal1"
      :container="container1"
    >
      <DialogTrigger
        class="text-grass11 font-semibold hover:bg-mauve3 inline-flex h-[35px] items-center justify-center rounded-md bg-white px-[15px] leading-none shadow-sm focus:shadow-[0_0_0_2px] focus:shadow-black dark:focus:shadow-green8 focus:outline-none border"
      >
        Open Dialog
      </DialogTrigger>
      <DialogPortal>
        <DialogOverlay
          :lock-target="containerScroll1"
          class="bg-blackA9 data-[state=open]:animate-overlayShow data-[contained]:absolute inset-0 z-30"
        />
        <DialogContent
          class="data-[state=open]:animate-contentShow data-[contained]:absolute top-[50%] left-[50%] max-h-[85vh] w-[90vw] max-w-[450px] translate-x-[-50%] translate-y-[-50%] rounded-[6px] bg-white p-[25px] shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] focus:outline-none z-[100]"
        >
          <DialogTitle class="text-mauve12 m-0 text-[17px] font-semibold">
            Edit profile
          </DialogTitle>
          <DialogDescription class="text-mauve11 mt-[10px] mb-5 text-sm leading-normal">
            Make changes to your profile here. Click save when you're done.
          </DialogDescription>
          <fieldset class="mb-[15px] flex items-center gap-5">
            <label
              class="text-grass11 w-[90px] text-right text-sm"
              for="name"
            > Name </label>
            <input
              id="name"
              class="text-grass11 bg-stone-50 shadow-green7 focus:shadow-green8 inline-flex h-[35px] w-full flex-1 items-center justify-center rounded-lg px-[10px] text-sm leading-none shadow-[0_0_0_1px] outline-none focus:shadow-[0_0_0_2px]"
              defaultValue="Pedro Duarte"
            >
          </fieldset>
          <div class="mt-[25px] flex justify-end">
            <DialogClose as-child>
              <button
                class="bg-green4 text-green11 text-sm hover:bg-green5 focus:shadow-green7 inline-flex h-[35px] items-center justify-center rounded-lg px-[15px] font-semibold leading-none focus:shadow-[0_0_0_2px] focus:outline-none"
              >
                Save changes
              </button>
            </DialogClose>
          </div>
          <DialogClose
            class="text-grass11 hover:bg-green4 focus:shadow-green7 absolute top-[10px] right-[10px] inline-flex h-[25px] w-[25px] appearance-none items-center justify-center rounded-full focus:shadow-[0_0_0_2px] focus:outline-none"
            aria-label="Close"
          >
            <Icon icon="lucide:x" />
          </DialogClose>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>

    <Separator
      class="bg-stone-300/50 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px my-[15px]"
    />

    <div class="flex flex-row justify-between">
      <h1 class="text-white text-lg font-semibold">
        Scroll Area
      </h1>
      <div class="flex gap-2 items-center">
        <label
          class="text-stone-700 dark:text-white text-sm leading-none pr-2 select-none"
          for="airplane-mode"
        >
          Modal
        </label>

        <SwitchRoot
          v-model="isModal2"
          class="w-[32px] h-[20px] shadow-sm flex data-[state=unchecked]:bg-stone-300 data-[state=checked]:bg-stone-800 dark:data-[state=unchecked]:bg-stone-800 dark:data-[state=checked]:bg-stone-700 border border-stone-300 data-[state=checked]:border-stone-700  dark:border-stone-700 rounded-full relative transition-[background] focus-within:outline-none focus-within:shadow-[0_0_0_1px] focus-within:border-stone-800 focus-within:shadow-stone-800"
        >
          <SwitchThumb
            class="w-3.5 h-3.5 my-auto bg-white text-xs flex items-center justify-center shadow-xl rounded-full transition-transform translate-x-0.5 will-change-transform data-[state=checked]:translate-x-full"
          />
        </SwitchRoot>
      </div>
    </div>

    <ScrollAreaRoot
      ref="container2"
      class="w-full h-[300px] relative overflow-hidden shadow-sm border rounded-xl bg-mauve2 text-mauve11 "
      style="--scrollbar-size: 10px"
      type="auto"
    >
      <ScrollAreaViewport
        ref="containerScroll2"
        class="w-full h-full p-5 text-sm leading-[1.5]"
      >
        <p>
          Lorem, ipsum dolor sit amet consectetur adipisicing elit. Accusamus nisi cum, repudiandae voluptas ullam
          error.
          Quisquam neque ratione, consectetur distinctio sequi tenetur tempora in cum iure fugit! Tempora, praesentium
          dolor.
        </p>
        <p>
          Saepe, commodi aperiam similique dolor perferendis impedit distinctio esse nostrum odit, aspernatur qui
          maiores
          repudiandae perspiciatis facere corporis! Natus vel sed repellat eveniet veniam in facilis perferendis ipsam
          nobis dicta.
        </p>
        <p>
          Consequatur numquam veritatis odit neque repellendus dignissimos nihil nemo. Sapiente non consequatur fugiat
          ea
          doloremque accusantium, in qui quisquam quod! Expedita aperiam nemo exercitationem iste nesciunt alias
          voluptatum et dolore.
        </p>
        <p>
          Nam beatae commodi et, sapiente, iusto dolor numquam delectus officiis ab aliquam dolorem debitis labore
          exercitationem natus totam at? Ut recusandae architecto quis nulla distinctio nihil, culpa dolor quo. Nisi!
        </p>
        <p>
          Numquam tempore consequuntur laboriosam est dolorum, dolores unde dolor sint, molestiae reiciendis doloribus,
          architecto ducimus eius culpa aspernatur neque eos. Perspiciatis eum architecto laudantium? Quae iusto porro
          ut.
          Enim, accusantium.
        </p>
        <p>
          Vero necessitatibus nesciunt earum deserunt voluptas cupiditate! Fugiat hic quaerat optio iste nulla nostrum
          eius nesciunt atque obcaecati natus aut expedita autem nemo recusandae sed, corrupti laudantium quas
          dignissimos
          veniam.
        </p>
        <p>
          Adipisci fugiat, nisi dolore, fugit quaerat quis cum minus vel incidunt temporibus enim voluptatibus esse
          commodi veritatis laborum quibusdam aut illo, voluptatum culpa dolores vero. Animi explicabo nostrum eius a.
        </p>
        <p>
          Ipsam debitis ad rem accusantium, molestias optio fugit tempore sit obcaecati a magnam quisquam
          exercitationem,
          culpa quasi dolor aut quis aspernatur qui sint. Aspernatur, enim non quisquam cumque expedita dolorem.
        </p>
        <p>
          Eligendi molestiae omnis dolorem repellendus ipsa consequatur dolore porro eum neque, rem similique corrupti
          illum veniam earum quis animi quisquam blanditiis fuga tenetur odio architecto libero. Asperiores doloribus
          ipsum id.
        </p>
      </ScrollAreaViewport>
      <ScrollAreaScrollbar
        class="flex select-none touch-none p-0.5 z-20 bg-blackA1 transition-colors duration-[160ms] ease-out hover:bg-blackA2 data-[orientation=vertical]:w-2.5 data-[orientation=horizontal]:flex-col data-[orientation=horizontal]:h-2.5"
        orientation="vertical"
      >
        <ScrollAreaThumb
          class="flex-1 bg-mauve10 rounded-[10px] relative before:content-[''] before:absolute before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:w-full before:h-full before:min-w-[44px] before:min-h-[44px]"
        />
      </ScrollAreaScrollbar>
      <ScrollAreaScrollbar
        class="flex select-none touch-none p-0.5 bg-blackA6 transition-colors duration-[160ms] ease-out hover:bg-blackA8 data-[orientation=vertical]:w-2.5 data-[orientation=horizontal]:flex-col data-[orientation=horizontal]:h-2.5"
        orientation="horizontal"
      >
        <ScrollAreaThumb
          class="flex-1 bg-mauve10 rounded-[10px] relative before:content-[''] before:absolute before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:w-full before:h-full before:min-w-[44px] before:min-h-[44px]"
        />
      </ScrollAreaScrollbar>
    </ScrollAreaRoot>

    <DialogRoot
      :modal="isModal2"
      :container="container2?.$el"
    >
      <DialogTrigger
        class="text-grass11 font-semibold hover:bg-mauve3 inline-flex h-[35px] items-center justify-center rounded-md bg-white px-[15px] leading-none shadow-sm focus:shadow-[0_0_0_2px] focus:shadow-black dark:focus:shadow-green8 focus:outline-none border"
        @click="console.log(containerScroll2?.viewportElement)"
      >
        Open Dialog
      </DialogTrigger>
      <DialogPortal>
        <DialogOverlay
          :lock-target="containerScroll2?.viewportElement"
          class="bg-blackA9 data-[state=open]:animate-overlayShow data-[contained]:absolute inset-0 z-30"
        />
        <DialogContent
          class="data-[state=open]:animate-contentShow data-[contained]:absolute top-[50%] left-[50%] max-h-[85vh] w-[90vw] max-w-[450px] translate-x-[-50%] translate-y-[-50%] rounded-[6px] bg-white p-[25px] shadow-[hsl(206_22%_7%_/_35%)_0px_10px_38px_-10px,_hsl(206_22%_7%_/_20%)_0px_10px_20px_-15px] focus:outline-none z-[100]"
        >
          <DialogTitle class="text-mauve12 m-0 text-[17px] font-semibold">
            Edit profile
          </DialogTitle>
          <DialogDescription class="text-mauve11 mt-[10px] mb-5 text-sm leading-normal">
            Make changes to your profile here. Click save when you're done.
          </DialogDescription>
          <fieldset class="mb-[15px] flex items-center gap-5">
            <label
              class="text-grass11 w-[90px] text-right text-sm"
              for="name"
            > Name </label>
            <input
              id="name"
              class="text-grass11 bg-stone-50 shadow-green7 focus:shadow-green8 inline-flex h-[35px] w-full flex-1 items-center justify-center rounded-lg px-[10px] text-sm leading-none shadow-[0_0_0_1px] outline-none focus:shadow-[0_0_0_2px]"
              defaultValue="Pedro Duarte"
            >
          </fieldset>
          <div class="mt-[25px] flex justify-end">
            <DialogClose as-child>
              <button
                class="bg-green4 text-green11 text-sm hover:bg-green5 focus:shadow-green7 inline-flex h-[35px] items-center justify-center rounded-lg px-[15px] font-semibold leading-none focus:shadow-[0_0_0_2px] focus:outline-none"
              >
                Save changes
              </button>
            </DialogClose>
          </div>
          <DialogClose
            class="text-grass11 hover:bg-green4 focus:shadow-green7 absolute top-[10px] right-[10px] inline-flex h-[25px] w-[25px] appearance-none items-center justify-center rounded-full focus:shadow-[0_0_0_2px] focus:outline-none"
            aria-label="Close"
          >
            <Icon icon="lucide:x" />
          </DialogClose>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>
  </div>
</template>
