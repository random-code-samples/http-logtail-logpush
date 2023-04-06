// All Redirect to https://gist.github.com/stefandanaita/88c4d8b187400d5b07524cd0a12843b2
// SPDX-License-Identifier: MIT-0

export default {
  async fetch(
    request: Request
  ): Promise<Response> {
    if (!request.body) {
      return new Response("Oops", { status: 500 });
    }

    const events = request.body
      .pipeThrough(new DecompressionStream("gzip"))
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(readlineStream());

    for await (const event of streamAsyncIterator(events)) {
      // Do stuff with the event
	  console.log(event)
      var response = await fetch("https://in.logtail.com", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: "Bearer ....", // You can use secrets here as well, see https://developers.cloudflare.com/workers/platform/environment-variables/#add-secrets-to-your-project
        },
        body: event,
      });
	  if (response.ok == false) {
		return new Response(`Logtail responded with: ${await response.text()}`, { status: 500 });
	  }
    }

    return new Response("Hello World!");
  },
};

async function* streamAsyncIterator(stream: ReadableStream) {
  // Get a lock on the stream
  const reader = stream.getReader();

  try {
    while (true) {
      // Read from the stream
      const { done, value } = await reader.read();

      // Exit if we're done
      if (done) {
        return;
      }

      // Else yield the chunk
      yield value;
    }
  } finally {
    reader.releaseLock();
  }
}

interface ReadlineTransformerOptions {
  skipEmpty: boolean;
}

const defaultOptions: ReadlineTransformerOptions = {
  skipEmpty: true,
};

export class ReadlineTransformer implements Transformer {
  options: ReadlineTransformerOptions;
  lastString: string;
  separator: RegExp;

  public constructor(options?: ReadlineTransformerOptions) {
    this.options = { ...defaultOptions, ...options };
    this.lastString = "";
    this.separator = /[\r\n]+/;
  }

  public transform(
    chunk: string,
    controller: TransformStreamDefaultController<string>
  ) {
    // prepend with previous string (empty if none)
    const str = `${this.lastString}${chunk}`;
    // Extract lines from chunk
    const lines = str.split(this.separator);
    // Save last line as it might be incomplete
    this.lastString = (lines.pop() || "").trim();

    // eslint-disable-next-line no-restricted-syntax
    for (const line of lines) {
      const d = this.options.skipEmpty ? line.trim() : line;
      if (d.length > 0) controller.enqueue(d);
    }
  }

  public flush(controller: TransformStreamDefaultController<string>) {
    if (this.lastString.length > 0) controller.enqueue(this.lastString);
  }
}

export const readlineStream = () =>
  new TransformStream(new ReadlineTransformer());
